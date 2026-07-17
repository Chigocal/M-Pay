from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

try:
    from backend.app.database import Base
except ImportError:
    from app.database import Base

class User(Base):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    auth_provider = Column(String, default="local", nullable=False)
    wallet_balance = Column(Float, default=0.0, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    persona_inquiry_id = Column(String, nullable=True)
    verified_legal_name = Column(String, nullable=True)
    otp_code = Column(String, nullable=True)
    otp_expiry = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Bidirectional relationship
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = {'extend_existing': True}

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # "CONVERSION" or "WITHDRAWAL"
    network = Column(String, nullable=True)  # e.g., "MTN", "Airtel" (nullable for withdrawal)
    amount = Column(Float, nullable=False)
    fee_deducted = Column(Float, default=0.0, nullable=False)
    net_payout = Column(Float, nullable=False)
    status = Column(String, default="PENDING", nullable=False)  # "PENDING", "SUCCESS", "FAILED"
    aggregator_session_id = Column(String, nullable=True)
    monnify_payment_ref = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Bidirectional relationship
    user = relationship("User", back_populates="transactions")
