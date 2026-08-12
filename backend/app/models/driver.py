from sqlalchemy import CheckConstraint, Column, DateTime, Integer, String, func
from sqlalchemy.orm import relationship

from app.database import Base


class Driver(Base):
    __tablename__ = "drivers"
    __table_args__ = (
        CheckConstraint("status IN ('available', 'on_trip')", name="ck_drivers_status"),
    )

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(64), nullable=True)
    status = Column(String(16), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="driver", uselist=False)
    orders = relationship("Order", back_populates="driver", foreign_keys="Order.driver_id")
