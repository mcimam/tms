from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Truck(Base):
    __tablename__ = "trucks"
    __table_args__ = (
        CheckConstraint("status IN ('available', 'on_trip')", name="ck_trucks_status"),
    )

    id = Column(Integer, primary_key=True)
    plate = Column(String(32), unique=True, nullable=False)
    type = Column(String(64), nullable=True)
    status = Column(String(16), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    orders = relationship("Order", back_populates="truck", foreign_keys="Order.truck_id")
