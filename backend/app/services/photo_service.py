import os
import uuid

from fastapi import UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.order import Order
from app.models.order_photo import OrderPhoto
from app.models.user import User

MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def _order_dir(order_id: int) -> str:
    path = os.path.join(settings.upload_dir, f"order_{order_id}")
    os.makedirs(path, exist_ok=True)
    return path


async def save_photo(db: Session, order: Order, user: User, upload_file: UploadFile) -> OrderPhoto:
    contents = await upload_file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise ValueError("File too large (max 10MB)")

    ext = os.path.splitext(upload_file.filename or "")[1]
    stored_name = f"{uuid.uuid4().hex}{ext}"
    order_dir = _order_dir(order.id)
    full_path = os.path.join(order_dir, stored_name)
    with open(full_path, "wb") as f:
        f.write(contents)

    photo = OrderPhoto(
        order_id=order.id,
        driver_id=user.driver_id if user.role == "driver" else None,
        file_path=os.path.relpath(full_path, settings.upload_dir),
        original_filename=upload_file.filename,
        content_type=upload_file.content_type,
    )
    db.add(photo)
    db.commit()
    db.refresh(photo)
    return photo


def absolute_path(photo: OrderPhoto) -> str:
    return os.path.join(settings.upload_dir, photo.file_path)
