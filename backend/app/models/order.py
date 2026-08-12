from sqlalchemy import CheckConstraint, Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class Order(Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('ORDER', 'ASSIGNED', 'ARRIVED', 'UNLOADING', 'COMPLETED')",
            name="ck_orders_status",
        ),
    )

    id = Column(Integer, primary_key=True)
    order_no = Column(String(32), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    load_location = Column(String(255), nullable=False)
    unload_location = Column(String(255), nullable=False)
    ship_date = Column(Date, nullable=True, index=True)
    load_time = Column(String(8), nullable=True)
    cargo_type = Column(String(128), nullable=True)
    tonnage = Column(String(32), nullable=True)
    notes = Column(Text, nullable=True)
    driver_id = Column(Integer, ForeignKey("drivers.id"), nullable=True, index=True)
    truck_id = Column(Integer, ForeignKey("trucks.id"), nullable=True, index=True)
    status = Column(String(16), nullable=False, default="ORDER", index=True)
    current_location = Column(String(255), nullable=True)
    eta = Column(String(64), nullable=True)
    est_unload_start = Column(String(64), nullable=True)
    est_unload_end = Column(String(64), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    driver = relationship("Driver", back_populates="orders", foreign_keys=[driver_id])
    truck = relationship("Truck", back_populates="orders", foreign_keys=[truck_id])
    photos = relationship("OrderPhoto", back_populates="order", cascade="all, delete-orphan")
