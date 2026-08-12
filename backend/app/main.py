from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import audit_logs, auth, customers, drivers, orders, trucks

app = FastAPI(title="TrackIt TMS API")

origins = ["*"] if settings.cors_origins == "*" else settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(customers.router, prefix="/api")
app.include_router(drivers.router, prefix="/api")
app.include_router(trucks.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(audit_logs.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}
