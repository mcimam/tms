from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class DriverBase(BaseModel):
    name: str
    phone: Optional[str] = None


class DriverCreate(DriverBase):
    username: Optional[str] = None
    password: Optional[str] = None


class DriverUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None


class DriverOut(DriverBase):
    id: int
    status: str
    has_login: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
