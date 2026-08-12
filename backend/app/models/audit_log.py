from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import relationship

from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        CheckConstraint("entity_type IN ('driver', 'truck', 'order')", name="ck_audit_logs_entity_type"),
        Index("ix_audit_logs_entity_type_id", "entity_type", "entity_id"),
    )

    id = Column(Integer, primary_key=True)
    entity_type = Column(String(16), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    field_name = Column(String(64), nullable=False)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    # Nullable: some transitions are system-triggered by an action a *different*
    # user took (e.g. completing an order flips the driver/truck back to
    # available) — those still get attributed to the acting user where one is
    # known, but the column stays nullable for any path where no user is
    # available at all.
    changed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    changed_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    user = relationship("User")
