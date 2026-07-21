import pytest
from fastapi import Depends
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from backend.app import models
from backend.app.database import Base, get_db
from backend.routers.auth import get_current_user

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.create_all(bind=engine)


def build_test_user(db):
    user = db.query(models.User).filter(models.User.email == "payout@example.com").first()
    if not user:
        user = models.User(
            email="payout@example.com",
            phone_number="08060000000",
            hashed_password="hashed-password",
            wallet_balance=500.0,
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_current_user(db=Depends(get_db)):
    user = build_test_user(db)
    return user


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_initiate_payout_returns_pending_authorization(monkeypatch, client):
    async def fake_initiate_single_transfer(*args, **kwargs):
        return {"status": "PENDING_AUTHORIZATION", "responseCode": "0"}

    from backend.routers import payouts

    monkeypatch.setattr(payouts.client, "initiate_single_transfer", fake_initiate_single_transfer)

    response = client.post(
        "/payouts/initiate",
        json={
            "amount": 200.0,
            "bank_code": "011",
            "account_number": "0123456789",
            "account_name": "Jane Doe",
            "narration": "Test payout",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["requires_otp"] is True
    assert payload["status"] == "pending_authorization"
