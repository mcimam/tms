from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db_utils import commit_or_conflict
from app.deps import get_db, require_role
from app.models.driver import Driver
from app.models.user import User
from app.schemas.driver import DriverCreate, DriverOut, DriverUpdate
from app.security import hash_password

router = APIRouter(prefix="/drivers", tags=["drivers"], dependencies=[Depends(require_role("staff"))])


def _to_out(db: Session, driver: Driver) -> DriverOut:
    has_login = db.query(User).filter(User.driver_id == driver.id).first() is not None
    out = DriverOut.model_validate(driver)
    out.has_login = has_login
    return out


@router.get("", response_model=list[DriverOut])
def list_drivers(status_filter: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Driver)
    if status_filter:
        query = query.filter(Driver.status == status_filter)
    drivers = query.order_by(Driver.name).all()
    return [_to_out(db, d) for d in drivers]


@router.post("", response_model=DriverOut, status_code=status.HTTP_201_CREATED)
def create_driver(payload: DriverCreate, db: Session = Depends(get_db)):
    if payload.username and db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")

    driver = Driver(name=payload.name, phone=payload.phone, status="available")
    db.add(driver)
    db.flush()

    if payload.username and payload.password:
        user = User(
            username=payload.username,
            hashed_password=hash_password(payload.password),
            role="driver",
            driver_id=driver.id,
            full_name=driver.name,
            is_active=True,
        )
        db.add(user)

    db.commit()
    db.refresh(driver)
    return _to_out(db, driver)


@router.get("/{driver_id}", response_model=DriverOut)
def get_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")
    return _to_out(db, driver)


@router.put("/{driver_id}", response_model=DriverOut)
def update_driver(driver_id: int, payload: DriverUpdate, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")

    data = payload.model_dump(exclude_unset=True)
    username = data.pop("username", None)
    password = data.pop("password", None)
    for key, value in data.items():
        setattr(driver, key, value)

    if username or password:
        user = db.query(User).filter(User.driver_id == driver.id).first()
        if user is None:
            if not username or not password:
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    "Both username and password are required to create a new login",
                )
            if db.query(User).filter(User.username == username).first():
                raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
            user = User(
                username=username,
                hashed_password=hash_password(password),
                role="driver",
                driver_id=driver.id,
                full_name=driver.name,
                is_active=True,
            )
            db.add(user)
        else:
            if username and username != user.username:
                if db.query(User).filter(User.username == username, User.id != user.id).first():
                    raise HTTPException(status.HTTP_409_CONFLICT, "Username already taken")
                user.username = username
            if password:
                user.hashed_password = hash_password(password)
            user.full_name = driver.name

    db.commit()
    db.refresh(driver)
    return _to_out(db, driver)


@router.delete("/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_driver(driver_id: int, db: Session = Depends(get_db)):
    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Driver not found")
    db.query(User).filter(User.driver_id == driver.id).delete()
    db.delete(driver)
    commit_or_conflict(db, "Driver masih memiliki order terkait, tidak bisa dihapus.")
