import sys
print("SYS PATH IS:", sys.path)
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from pytest_httpx import HTTPXMock

from main import app
from backend.app.database import Base, get_db
from backend.app import models
from backend.routers.auth import get_current_user
from backend.app.config import settings

# In-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in test database dynamically using a single import path
try:
    from backend.app.database import Base, get_db
    from backend.app import models
    print("SUCCESSFULLY LOADED MODELS FROM backend.app")
except ImportError:
    from app.database import Base, get_db
    import app.models as models
    print("SUCCESSFULLY LOADED MODELS FROM app")

Base.metadata.create_all(bind=engine)


@pytest.fixture
def test_user():
    """
    Creates a temporary test user in the SQLite test database.
    """
    db = TestingSessionLocal()
    user = db.query(models.User).filter(models.User.email == "test@example.com").first()
    if not user:
        user = models.User(
            email="test@example.com",
            phone_number="08061234567",
            hashed_password="hashedpassword",
            wallet_balance=100.0,
            is_verified=True
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    db.close()
    return user


@pytest.fixture
def db_session():
    """
    Provides a database session for test verification.
    """
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def override_dependencies(test_user):
    """
    Overrides FastAPI dependencies to use the in-memory SQLite database and test user.
    """
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()
            
    from fastapi import Depends
    def override_current_user(db = Depends(get_db)):
        user = db.query(models.User).filter(models.User.id == test_user.id).first()
        return user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_current_user
    yield
    app.dependency_overrides.clear()


client = TestClient(app)


def test_initiate_conversion_insufficient_amount():
    """
    Ensure the initiate endpoint rejects amounts below 50.
    """
    response = client.post(
        "/conversions/initiate",
        json={"network": "MTN", "phone_number": "08061234567", "amount": 40}
    )
    assert response.status_code == 400
    assert "Minimum conversion amount" in response.json()["detail"]


def test_initiate_conversion_quota_full(httpx_mock: HTTPXMock):
    """
    Verify the initiate endpoint fails when the aggregator reports no quota.
    """
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/check/quota/availability",
        json={"code": 5030, "message": "Recipient Unavailable"}
    )
    
    response = client.post(
        "/conversions/initiate",
        json={"network": "MTN", "phone_number": "08061234567", "amount": 1000}
    )
    assert response.status_code == 400
    assert "Recipient quota full" in response.json()["detail"]


def test_initiate_conversion_success(httpx_mock: HTTPXMock, db_session):
    """
    Verify successful registration of a pending transaction on initiate request.
    """
    # Mock quota availability success (returns 2000 code)
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/check/quota/availability",
        json={"code": 2000, "message": "Recipient(s) Available"}
    )
    
    # Mock OTP generation response
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/generate/otp",
        json={"code": 2000, "message": "Otp sent successfully to +23486*****73"}
    )
    
    response = client.post(
        "/conversions/initiate",
        json={"network": "MTN", "phone_number": "08061234567", "amount": 1000}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "success"
    
    # Assert database state
    txn = db_session.query(models.Transaction).filter(
        models.Transaction.network == "MTN",
        models.Transaction.amount == 1000.0,
        models.Transaction.status == "PENDING"
    ).first()
    assert txn is not None
    assert txn.type == "CONVERSION"


def test_verify_conversion_success(httpx_mock: HTTPXMock, db_session, test_user):
    """
    Verify successful verification completes the transaction, transfers airtime,
    and updates the user's wallet balance.
    """
    # Create matching pending transaction in database
    txn = models.Transaction(
        user_id=test_user.id,
        type="CONVERSION",
        network="MTN",
        amount=1000.0,
        fee_deducted=0.0,
        net_payout=0.0,
        status="PENDING"
    )
    db_session.add(txn)
    db_session.commit()
    
    # Mock OTP verification response
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/verify/otp",
        json={
            "code": 2000,
            "message": "Otp verified.",
            "data": {
                "sessionId": "mock_session_123"
            }
        }
    )
    
    # Mock transfer completion response
    httpx_mock.add_response(
        method="POST",
        url=f"{settings.AGGREGATOR_BASE_URL.rstrip('/')}/api/v1/transfer/airtime",
        json={
            "code": 2000,
            "message": "Transfer completed successfully."
        }
    )
    
    response = client.post(
        "/conversions/verify",
        json={
            "network": "MTN",
            "phone_number": "08061234567",
            "amount": 1000,
            "otp": "123456",
            "pin": "1111"
        }
    )
    
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["status"] == "success"
    assert "reference" in res_data
    assert res_data["payout_amount"] == 800.0  # 1000 * 0.8 rate
    assert res_data["new_wallet_balance"] == 900.0  # 100.0 starting balance + 800.0 net payout
    
    # Verify transaction states in database
    db_session.refresh(txn)
    assert txn.status == "COMPLETED"
    assert txn.net_payout == 800.0
    assert txn.aggregator_session_id == "mock_session_123"
