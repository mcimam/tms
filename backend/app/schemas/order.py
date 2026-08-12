from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class OrderBase(BaseModel):
    customer_id: int
    load_location: str
    unload_location: str
    ship_date: Optional[date] = None
    load_time: Optional[str] = None
    cargo_type: Optional[str] = None
    tonnage: Optional[str] = None
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    pass


class OrderUpdate(BaseModel):
    customer_id: Optional[int] = None
    load_location: Optional[str] = None
    unload_location: Optional[str] = None
    ship_date: Optional[date] = None
    load_time: Optional[str] = None
    cargo_type: Optional[str] = None
    tonnage: Optional[str] = None
    notes: Optional[str] = None


class OrderAssignRequest(BaseModel):
    driver_id: int
    truck_id: int


class OrderStatusUpdate(BaseModel):
    status: str


class OrderLocationUpdate(BaseModel):
    current_location: Optional[str] = None
    eta: Optional[str] = None
    est_unload_start: Optional[str] = None
    est_unload_end: Optional[str] = None


class OrderOut(OrderBase):
    id: int
    order_no: str
    driver_id: Optional[int] = None
    truck_id: Optional[int] = None
    status: str
    current_location: Optional[str] = None
    eta: Optional[str] = None
    est_unload_start: Optional[str] = None
    est_unload_end: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    customer_name: Optional[str] = None
    driver_name: Optional[str] = None
    truck_plate: Optional[str] = None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    items: list[OrderOut]
    total: int
    page: int
    page_size: int


class OrderStatsResponse(BaseModel):
    total: int
    ORDER: int
    ASSIGNED: int
    ARRIVED: int
    UNLOADING: int
    COMPLETED: int
