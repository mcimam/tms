from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.order import Order
from app.models.truck import Truck


def generate_order_no(db: Session) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"ORD-{today}-"
    count_today = db.query(func.count(Order.id)).filter(Order.order_no.like(f"{prefix}%")).scalar() or 0
    return f"{prefix}{count_today + 1:04d}"


def assign_order(db: Session, order: Order, driver_id: int, truck_id: int) -> Order:
    if order.status != "ORDER":
        raise HTTPException(status.HTTP_409_CONFLICT, "Order has already been assigned")

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None or driver.status != "available":
        raise HTTPException(status.HTTP_409_CONFLICT, "Selected driver is not available")

    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if truck is None or truck.status != "available":
        raise HTTPException(status.HTTP_409_CONFLICT, "Selected truck is not available")

    order.driver_id = driver_id
    order.truck_id = truck_id
    order.status = "ASSIGNED"
    driver.status = "on_trip"
    truck.status = "on_trip"

    db.commit()
    db.refresh(order)
    return order


VALID_STATUS_TRANSITIONS = ["ASSIGNED", "ARRIVED", "UNLOADING", "COMPLETED"]


def update_status(db: Session, order: Order, new_status: str) -> Order:
    if new_status not in VALID_STATUS_TRANSITIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status")
    if order.status == "ORDER":
        raise HTTPException(status.HTTP_409_CONFLICT, "Order must be assigned before its status can change")

    order.status = new_status

    if new_status == "COMPLETED":
        if order.driver_id:
            driver = db.query(Driver).filter(Driver.id == order.driver_id).first()
            if driver:
                driver.status = "available"
        if order.truck_id:
            truck = db.query(Truck).filter(Truck.id == order.truck_id).first()
            if truck:
                truck.status = "available"

    db.commit()
    db.refresh(order)
    return order


def update_location(db: Session, order: Order, data: dict) -> Order:
    for key, value in data.items():
        if value is not None:
            setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order
