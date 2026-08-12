from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db_utils import commit_or_conflict
from app.deps import get_db, require_role
from app.models.truck import Truck
from app.schemas.truck import TruckCreate, TruckOut, TruckUpdate

router = APIRouter(prefix="/trucks", tags=["trucks"], dependencies=[Depends(require_role("staff"))])


@router.get("", response_model=list[TruckOut])
def list_trucks(status_filter: str | None = None, db: Session = Depends(get_db)):
    query = db.query(Truck)
    if status_filter:
        query = query.filter(Truck.status == status_filter)
    return query.order_by(Truck.plate).all()


@router.post("", response_model=TruckOut, status_code=status.HTTP_201_CREATED)
def create_truck(payload: TruckCreate, db: Session = Depends(get_db)):
    if db.query(Truck).filter(Truck.plate == payload.plate).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "A truck with this plate already exists")
    truck = Truck(**payload.model_dump())
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


@router.get("/{truck_id}", response_model=TruckOut)
def get_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if truck is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Truck not found")
    return truck


@router.put("/{truck_id}", response_model=TruckOut)
def update_truck(truck_id: int, payload: TruckUpdate, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if truck is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Truck not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(truck, key, value)
    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/{truck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if truck is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Truck not found")
    db.delete(truck)
    commit_or_conflict(db, "Truck masih memiliki order terkait, tidak bisa dihapus.")
