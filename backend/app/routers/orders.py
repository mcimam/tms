import os
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.deps import get_current_user, get_db, get_owned_order, require_role
from app.models.customer import Customer
from app.models.order import Order
from app.models.order_photo import OrderPhoto
from app.models.user import User
from app.schemas.order import (
    OrderAssignRequest,
    OrderCreate,
    OrderListResponse,
    OrderLocationUpdate,
    OrderOut,
    OrderStatsResponse,
    OrderStatusUpdate,
    OrderUpdate,
)
from app.schemas.order_photo import OrderPhotoOut
from app.services import order_service, photo_service

router = APIRouter(prefix="/orders", tags=["orders"])


def _to_out(order: Order) -> OrderOut:
    out = OrderOut.model_validate(order)
    out.customer_name = order.customer.name if order.customer else None
    out.driver_name = order.driver.name if order.driver else None
    out.truck_plate = order.truck.plate if order.truck else None
    return out


def _apply_scope_and_filters(
    query,
    user: User,
    status_filter: str | None,
    customer_id: int | None,
    driver_id: int | None,
    date_from: date | None,
    date_to: date | None,
    search: str | None,
):
    if user.role == "driver":
        query = query.filter(Order.driver_id == user.driver_id)
    elif driver_id is not None:
        query = query.filter(Order.driver_id == driver_id)

    if status_filter:
        query = query.filter(Order.status == status_filter)
    if customer_id is not None:
        query = query.filter(Order.customer_id == customer_id)
    if date_from is not None:
        query = query.filter(Order.ship_date >= date_from)
    if date_to is not None:
        query = query.filter(Order.ship_date <= date_to)
    if search:
        like = f"%{search}%"
        query = query.join(Customer, Order.customer_id == Customer.id).filter(
            or_(Order.order_no.ilike(like), Customer.name.ilike(like))
        )
    return query


@router.get("", response_model=OrderListResponse)
def list_orders(
    status: str | None = None,
    customer_id: int | None = None,
    driver_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = _apply_scope_and_filters(
        db.query(Order), user, status, customer_id, driver_id, date_from, date_to, search
    )
    total = query.count()
    items = (
        query.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return OrderListResponse(items=[_to_out(o) for o in items], total=total, page=page, page_size=page_size)


@router.get("/stats", response_model=OrderStatsResponse)
def order_stats(
    customer_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = _apply_scope_and_filters(db.query(Order), user, None, customer_id, None, date_from, date_to, None)
    orders = query.all()
    counts = {"ORDER": 0, "ASSIGNED": 0, "ARRIVED": 0, "UNLOADING": 0, "COMPLETED": 0}
    for o in orders:
        counts[o.status] = counts.get(o.status, 0) + 1
    return OrderStatsResponse(total=len(orders), **counts)


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_role("staff"))])
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
    if customer is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Customer not found")

    order = Order(
        order_no=order_service.generate_order_no(db),
        status="ORDER",
        current_location=payload.load_location,
        **payload.model_dump(),
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return _to_out(order)


@router.get("/{order_id}", response_model=OrderOut)
def get_order(order: Order = Depends(get_owned_order)):
    return _to_out(order)


@router.put("/{order_id}", response_model=OrderOut, dependencies=[Depends(require_role("staff"))])
def update_order(payload: OrderUpdate, order: Order = Depends(get_owned_order), db: Session = Depends(get_db)):
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return _to_out(order)


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_role("staff"))])
def delete_order(order: Order = Depends(get_owned_order), db: Session = Depends(get_db)):
    if order.status not in ("ORDER", "COMPLETED"):
        order_service.free_driver_and_truck(db, order)
    db.delete(order)
    db.commit()


@router.post("/{order_id}/assign", response_model=OrderOut, dependencies=[Depends(require_role("staff"))])
def assign_order(payload: OrderAssignRequest, order: Order = Depends(get_owned_order), db: Session = Depends(get_db)):
    order = order_service.assign_order(db, order, payload.driver_id, payload.truck_id)
    return _to_out(order)


@router.patch("/{order_id}/status", response_model=OrderOut, dependencies=[Depends(require_role("staff"))])
def update_order_status(payload: OrderStatusUpdate, order: Order = Depends(get_owned_order), db: Session = Depends(get_db)):
    order = order_service.update_status(db, order, payload.status)
    return _to_out(order)


@router.patch("/{order_id}/location", response_model=OrderOut)
def update_order_location(
    payload: OrderLocationUpdate,
    order: Order = Depends(get_owned_order),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if user.role not in ("staff", "driver"):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not permitted")
    order = order_service.update_location(db, order, payload.model_dump(exclude_unset=True))
    return _to_out(order)


@router.post("/{order_id}/photos", response_model=OrderPhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_order_photo(
    order: Order = Depends(get_owned_order),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    file: UploadFile = File(...),
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only image uploads are allowed")
    try:
        photo = await photo_service.save_photo(db, order, user, file)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e))
    return photo


@router.get("/{order_id}/photos", response_model=list[OrderPhotoOut])
def list_order_photos(order: Order = Depends(get_owned_order), db: Session = Depends(get_db)):
    return db.query(OrderPhoto).filter(OrderPhoto.order_id == order.id).order_by(OrderPhoto.uploaded_at.desc()).all()


@router.get("/{order_id}/photos/{photo_id}/file")
def get_order_photo_file(photo_id: int, order: Order = Depends(get_owned_order), db: Session = Depends(get_db)):
    photo = db.query(OrderPhoto).filter(OrderPhoto.id == photo_id, OrderPhoto.order_id == order.id).first()
    if photo is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo not found")
    path = photo_service.absolute_path(photo)
    if not os.path.isfile(path):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Photo file missing on disk")
    return FileResponse(path, media_type=photo.content_type or "application/octet-stream")
