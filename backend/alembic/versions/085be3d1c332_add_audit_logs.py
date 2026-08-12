"""add audit_logs table

Revision ID: 085be3d1c332
Revises: a0ff28e8ccb4
Create Date: 2026-08-12

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "085be3d1c332"
down_revision: Union[str, None] = "a0ff28e8ccb4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("entity_type", sa.String(length=16), nullable=False),
        sa.Column("entity_id", sa.Integer(), nullable=False),
        sa.Column("field_name", sa.String(length=64), nullable=False),
        sa.Column("old_value", sa.Text(), nullable=True),
        sa.Column("new_value", sa.Text(), nullable=True),
        sa.Column("changed_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("changed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("entity_type IN ('driver', 'truck', 'order')", name="ck_audit_logs_entity_type"),
    )
    op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
    op.create_index("ix_audit_logs_entity_id", "audit_logs", ["entity_id"])
    op.create_index("ix_audit_logs_entity_type_id", "audit_logs", ["entity_type", "entity_id"])


def downgrade() -> None:
    op.drop_index("ix_audit_logs_entity_type_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_entity_type", table_name="audit_logs")
    op.drop_table("audit_logs")
