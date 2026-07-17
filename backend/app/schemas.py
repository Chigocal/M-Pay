from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, ConfigDict, Field

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    phone_number: str
    password: str


class GoogleLoginRequest(BaseModel):
    token: str


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit OTP verification code")


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    phone_number: str
    wallet_balance: float
    is_verified: bool
    verified_legal_name: Optional[str] = None
    auth_provider: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Transaction Schemas
class ConversionRequest(BaseModel):
    network: Literal["MTN", "AIRTEL", "GLO", "9MOBILE"]
    amount: float = Field(..., ge=50.0, description="Amount to convert, minimum is 50")
    phone_number: str
    pin: str


class WithdrawalRequest(BaseModel):
    bank_code: str
    account_number: str
    amount: float = Field(..., ge=50.0, description="Amount to withdraw, minimum is 50")


class TransactionResponse(BaseModel):
    id: int
    type: str
    amount: float
    fee_deducted: float
    net_payout: float
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Persona Webhook Schemas
# Webhook Payload to strictly validate Persona's inquiry.completed event
class PersonaInquiryFields(BaseModel):
    name_first: Optional[dict] = Field(default=None, alias="name-first")
    name_last: Optional[dict] = Field(default=None, alias="name-last")

    model_config = ConfigDict(extra="ignore")


class PersonaInquiryAttributes(BaseModel):
    status: str
    reference_id: Optional[str] = None
    fields: Optional[PersonaInquiryFields] = None

    model_config = ConfigDict(extra="ignore")


class PersonaInquiryData(BaseModel):
    id: str
    type: str
    attributes: PersonaInquiryAttributes

    model_config = ConfigDict(extra="ignore")


class PersonaEventPayloadData(BaseModel):
    data: PersonaInquiryData

    model_config = ConfigDict(extra="ignore")


class PersonaEventAttributes(BaseModel):
    name: str
    payload: PersonaEventPayloadData

    model_config = ConfigDict(extra="ignore")


class PersonaEventData(BaseModel):
    id: str
    type: str
    attributes: PersonaEventAttributes

    model_config = ConfigDict(extra="ignore")


class PersonaWebhookPayload(BaseModel):
    data: PersonaEventData

    model_config = ConfigDict(extra="ignore")
