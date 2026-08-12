from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class OrderPhotoOut(BaseModel):
    id: int
    order_id: int
    driver_id: Optional[int] = None
    original_filename: Optional[str] = None
    content_type: Optional[str] = None
    uploaded_at: datetime

    model_config = {"from_attributes": True}
