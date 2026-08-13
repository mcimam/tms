from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.driver import Driver
from app.models.order import Order
from app.models.truck import Truck
from app.models.user import User
from app.services import audit_service


def generate_order_no(db: Session) -> str:
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"ORD-{today}-"
    # Base the next number on the highest suffix ever used today, not a count
    # of currently-existing rows: a deleted order leaves a gap, and counting
    # rows would regenerate an already-used (and still taken) order_no forever.
    last_order_no = (
        db.query(Order.order_no)
        .filter(Order.order_no.like(f"{prefix}%"))
        .order_by(Order.order_no.desc())
        .limit(1)
        .scalar()
    )
    next_seq = int(last_order_no[len(prefix):]) + 1 if last_order_no else 1
    return f"{prefix}{next_seq:04d}"


def assign_order(db: Session, order: Order, driver_id: int, truck_id: int, user: Optional[User] = None) -> Order:
    if order.status != "ORDER":
        raise HTTPException(status.HTTP_409_CONFLICT, "Order has already been assigned")

    driver = db.query(Driver).filter(Driver.id == driver_id).first()
    if driver is None or driver.status != "available":
        raise HTTPException(status.HTTP_409_CONFLICT, "Selected driver is not available")

    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if truck is None or truck.status != "available":
        raise HTTPException(status.HTTP_409_CONFLICT, "Selected truck is not available")

    old_order_status = order.status
    old_driver_status = driver.status
    old_truck_status = truck.status

    order.driver_id = driver_id
    order.truck_id = truck_id
    order.status = "ASSIGNED"
    driver.status = "on_trip"
    truck.status = "on_trip"

    audit_service.log_change(db, "order", order.id, "status", old_order_status, order.status, user)
    audit_service.log_change(db, "driver", driver.id, "status", old_driver_status, driver.status, user)
    audit_service.log_change(db, "truck", truck.id, "status", old_truck_status, truck.status, user)

    db.commit()
    db.refresh(order)
    return order


VALID_STATUS_TRANSITIONS = ["ASSIGNED", "ARRIVED", "UNLOADING", "COMPLETED"]


def free_driver_and_truck(db: Session, order: Order, user: Optional[User] = None) -> None:
    """Mark this order's driver/truck available, but only if neither has any
    OTHER non-completed order outstanding. Counting instead of unconditionally
    setting keeps "available" a true derived function of order data — it does
    not depend on an invariant (at most one active order per driver/truck)
    holding elsewhere in the system.

    `user` is the staff user whose action (completing or deleting the order)
    triggered this system-side transition — the resulting audit log rows for
    the driver/truck are attributed to them, not left orphaned, even though
    they didn't directly edit the driver/truck record.
    """
    if order.driver_id:
        other_active = (
            db.query(Order)
            .filter(
                Order.driver_id == order.driver_id,
                Order.id != order.id,
                Order.status != "COMPLETED",
            )
            .count()
        )
        if other_active == 0:
            driver = db.query(Driver).filter(Driver.id == order.driver_id).first()
            if driver and driver.status != "available":
                old_status = driver.status
                driver.status = "available"
                audit_service.log_change(db, "driver", driver.id, "status", old_status, driver.status, user)
    if order.truck_id:
        other_active = (
            db.query(Order)
            .filter(
                Order.truck_id == order.truck_id,
                Order.id != order.id,
                Order.status != "COMPLETED",
            )
            .count()
        )
        if other_active == 0:
            truck = db.query(Truck).filter(Truck.id == order.truck_id).first()
            if truck and truck.status != "available":
                old_status = truck.status
                truck.status = "available"
                audit_service.log_change(db, "truck", truck.id, "status", old_status, truck.status, user)


def update_status(db: Session, order: Order, new_status: str, user: Optional[User] = None) -> Order:
    if new_status not in VALID_STATUS_TRANSITIONS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status")
    if order.status == "ORDER":
        raise HTTPException(status.HTTP_409_CONFLICT, "Order must be assigned before its status can change")

    old_status = order.status
    order.status = new_status
    audit_service.log_change(db, "order", order.id, "status", old_status, order.status, user)

    if new_status == "COMPLETED":
        free_driver_and_truck(db, order, user)

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
