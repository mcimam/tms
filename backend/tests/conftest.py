import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.deps import get_db
from app.main import app
from app.models.driver import Driver
from app.models.user import User
from app.security import create_access_token, hash_password


@pytest.fixture()
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _enable_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture()
def db_session(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db_engine):
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=db_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def _make_user(db_session, username, role, driver_id=None):
    user = User(
        username=username,
        hashed_password=hash_password("password123"),
        role=role,
        driver_id=driver_id,
        full_name=username.title(),
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def staff_headers(client, db_session):
    user = _make_user(db_session, "staffuser", "staff")
    token = create_access_token(user_id=user.id, role=user.role, driver_id=user.driver_id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def driver(db_session):
    d = Driver(name="Test Driver", phone="555-0100", status="available")
    db_session.add(d)
    db_session.commit()
    db_session.refresh(d)
    return d


@pytest.fixture()
def driver_headers(client, db_session, driver):
    user = _make_user(db_session, "driveruser", "driver", driver_id=driver.id)
    token = create_access_token(user_id=user.id, role=user.role, driver_id=driver.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def customer(client, staff_headers):
    resp = client.post("/api/customers", json={"name": "Acme Corp", "contact": "acme@example.com"}, headers=staff_headers)
    assert resp.status_code == 201
    return resp.json()
