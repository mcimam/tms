from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.deps import get_db, require_role
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogListResponse, AuditLogOut

router = APIRouter(prefix="/audit-logs", tags=["audit-logs"], dependencies=[Depends(require_role("staff"))])


def _to_out(log: AuditLog) -> AuditLogOut:
    out = AuditLogOut.model_validate(log)
    out.changed_by_name = log.user.full_name if log.user else None
    return out


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    entity_type: str | None = None,
    entity_id: int | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
    db: Session = Depends(get_db),
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id is not None:
        query = query.filter(AuditLog.entity_id == entity_id)

    total = query.count()
    items = (
        # Rows written in the same DB transaction (e.g. an order-status
        # change plus its driver/truck free-up) share an identical
        # changed_at, since Postgres evaluates now() once per transaction —
        # id DESC is needed as a stable tiebreaker so pagination doesn't
        # reorder/duplicate rows across pages.
        query.order_by(AuditLog.changed_at.desc(), AuditLog.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return AuditLogListResponse(items=[_to_out(i) for i in items], total=total, page=page, page_size=page_size)
