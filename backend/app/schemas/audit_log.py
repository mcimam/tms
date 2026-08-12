from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    entity_type: str
    entity_id: int
    field_name: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    changed_by: Optional[int] = None
    changed_by_name: Optional[str] = None
    changed_at: datetime

    model_config = {"from_attributes": True}


class AuditLogListResponse(BaseModel):
    items: list[AuditLogOut]
    total: int
    page: int
    page_size: int
