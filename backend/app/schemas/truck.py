from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class TruckBase(BaseModel):
    plate: str
    type: Optional[str] = None


class TruckCreate(TruckBase):
    pass


class TruckUpdate(BaseModel):
    plate: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None


class TruckOut(TruckBase):
    id: int
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
