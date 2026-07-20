import uuid
from typing import Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db
    from backend.app import models
    from backend.routers.auth import get_current_user
    from backend.services.data_service import calculate_data_payout, generate_data_ussd
except ImportError:
    from app.database import get_db
    import app.models as models
    from routers.auth import get_current_user
    from services.data_service import calculate_data_payout, generate_data_ussd

router = APIRouter(prefix="/data-conversions", tags=["Data Conversions"])


class DataConversionInitiateRequest(BaseModel):
    phone_number: str = Field(..., description="Mobile phone number to load the data bundle from")
    network: Literal["MTN", "AIRTEL", "GLO", "9MOBILE"] = Field(..., description="Mobile network provider")
    bundle_type: Optional[str] = Field(None, description="Data bundle type such as 500MB or 1GB")
    amount: Optional[float] = Field(None, ge=1.0, description="Numeric amount or bundle value used for the conversion")
    pin: Optional[str] = Field("0000", description="Network PIN where required for USSD execution")
    validity: int = Field(30, gt=0, description="Validity days for Airtel USSD string")

    @model_validator(mode="before")
    def require_amount_or_bundle(cls, values):
        bundle_type = values.get("bundle_type")
        amount = values.get("amount")
        if bundle_type is None and amount is None:
            raise ValueError("Either bundle_type or amount must be provided.")
        if bundle_type is not None and amount is not None:
            raise ValueError("Provide either bundle_type or amount, not both.")
        return values


class DataConversionInitiateResponse(BaseModel):
    transaction_reference: str
    cash_value: float
    ussd_string: str


@router.post("/initiate", response_model=DataConversionInitiateResponse)
def initiate_data_conversion(
    payload: DataConversionInitiateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Initiate a data bundle conversion request and create a pending transaction record.
    """
    try:
        bundle_key = payload.bundle_type if payload.bundle_type is not None else str(int(payload.amount))
        cash_value = calculate_data_payout(payload.network, bundle_key)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

    try:
        ussd_string = generate_data_ussd(
            network=payload.network,
            phone_number=payload.phone_number,
            amount_or_bundle=bundle_key,
            validity=payload.validity,
            pin=payload.pin,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc)
        )

    transaction_reference = f"MPAY-{uuid.uuid4().hex[:12].upper()}"

    new_transaction = models.Transaction(
        user_id=current_user.id,
        type="DATA_CONVERSION",
        network=payload.network.upper(),
        amount=float(cash_value),
        fee_deducted=0.0,
        net_payout=float(cash_value),
        status="PENDING",
        aggregator_session_id=transaction_reference,
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    return {
        "transaction_reference": transaction_reference,
        "cash_value": cash_value,
        "ussd_string": ussd_string,
    }


@router.post("/admin-verify/{transaction_id}")
def admin_verify_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Securely reconcile a pending data conversion and credit the corresponding user's wallet.
    """
    transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found."
        )

    if transaction.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING transactions can be verified."
        )

    if transaction.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to verify this transaction."
        )

    user = db.query(models.User).filter(models.User.id == transaction.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account for this transaction was not found."
        )

    transaction.status = "COMPLETED"
    user.wallet_balance += float(transaction.net_payout)

    db.commit()
    db.refresh(transaction)
    db.refresh(user)

    return {
        "status": "success",
        "transaction_id": transaction.id,
        "transaction_reference": transaction.aggregator_session_id,
        "new_wallet_balance": user.wallet_balance,
    }
