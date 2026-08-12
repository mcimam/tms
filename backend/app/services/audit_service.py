from typing import Any, Optional

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def log_change(
    db: Session,
    entity_type: str,
    entity_id: int,
    field_name: str,
    old_value: Any,
    new_value: Any,
    user: Optional[User] = None,
) -> None:
    """Stage a single audit log row for a field change.

    Does NOT call db.commit() — callers are expected to add this to the same
    transaction as the mutation it describes (via db.add + the caller's
    existing db.commit()) so a log entry never exists without the change it
    describes, or vice versa.
    """
    db.add(
        AuditLog(
            entity_type=entity_type,
            entity_id=entity_id,
            field_name=field_name,
            old_value=None if old_value is None else str(old_value),
            new_value=None if new_value is None else str(new_value),
            changed_by=user.id if user is not None else None,
        )
    )


def log_field_diff(
    db: Session,
    entity_type: str,
    entity_id: int,
    old_values: dict,
    new_values: dict,
    user: Optional[User] = None,
) -> None:
    """Diff two {field_name: value} dicts and log one row per field that
    actually changed. Fields present only in old_values (not touched by this
    update) are ignored.
    """
    for field_name, new_value in new_values.items():
        old_value = old_values.get(field_name)
        if old_value != new_value:
            log_change(db, entity_type, entity_id, field_name, old_value, new_value, user)
