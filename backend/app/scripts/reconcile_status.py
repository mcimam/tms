"""One-off repair script: recompute every driver's and truck's `status` from
actual order data and correct any drift, then print what it changed.

Needed because a driver/truck's `status` is a stored, event-driven field kept
in sync by the order lifecycle (assign/complete/delete) rather than computed
on every read. If a row's status was ever set incorrectly by code that
predates the fix in app/services/order_service.py::free_driver_and_truck
(previously an unconditional set instead of a count-based check), that bad
value stays wrong forever until something rewrites it — this script does
that rewrite once, for every row, in one pass.

Run via `docker compose exec backend python -m app.scripts.reconcile_status`.
Safe to run any time, including on a fully healthy database (no-op then).
"""
from sqlalchemy import func

from app.database import SessionLocal
from app.models.driver import Driver
from app.models.order import Order
from app.models.truck import Truck


def correct_status(active_orders: int) -> str:
    return "on_trip" if active_orders > 0 else "available"


def main() -> None:
    db = SessionLocal()
    try:
        fixed = 0

        driver_active_counts = dict(
            db.query(Order.driver_id, func.count(Order.id))
            .filter(Order.driver_id.isnot(None), Order.status != "COMPLETED")
            .group_by(Order.driver_id)
            .all()
        )
        for driver in db.query(Driver).all():
            expected = correct_status(driver_active_counts.get(driver.id, 0))
            if driver.status != expected:
                print(f"driver #{driver.id} '{driver.name}': {driver.status} -> {expected}")
                driver.status = expected
                fixed += 1

        truck_active_counts = dict(
            db.query(Order.truck_id, func.count(Order.id))
            .filter(Order.truck_id.isnot(None), Order.status != "COMPLETED")
            .group_by(Order.truck_id)
            .all()
        )
        for truck in db.query(Truck).all():
            expected = correct_status(truck_active_counts.get(truck.id, 0))
            if truck.status != expected:
                print(f"truck #{truck.id} '{truck.plate}': {truck.status} -> {expected}")
                truck.status = expected
                fixed += 1

        if fixed:
            db.commit()
            print(f"Fixed {fixed} row(s).")
        else:
            print("No drift found — all driver/truck statuses already match their order data.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
