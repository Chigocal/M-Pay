import logging
import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

try:
    from backend.app.database import get_db
    from backend.app import models
    from backend.routers.auth import get_current_user
    from backend.services.monnify_service import MonnifyClient, MonnifyException
except ImportError:  # pragma: no cover
    from app.database import get_db
    import app.models as models
    from routers.auth import get_current_user
    from services.monnify_service import MonnifyClient, MonnifyException

router = APIRouter(prefix="/payouts", tags=["Payouts"])
client = MonnifyClient()


class PayoutInitiateRequest(BaseModel):
    amount: float = Field(..., description="The amount to disburse.")
    bank_name: str | None = Field(None, description="Destination bank name.")
    bank_code: str | None = Field(None, description="Destination bank code.")
    account_number: str = Field(..., description="Destination account number.")
    account_name: str = Field(..., description="Destination account name.")
    narration: str = Field(default="M-Pay payout", description="Payout narration.")


class PayoutAuthorizeRequest(BaseModel):
    reference: str = Field(..., description="The Monnify payout reference.")
    otp: str = Field(..., min_length=4, description="OTP received for MFA authorization.")


@router.post("/initiate")
async def initiate_payout(
    request: PayoutInitiateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.wallet_balance < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    if not request.bank_code and not request.bank_name:
        raise HTTPException(status_code=400, detail="Bank name or bank code is required.")

    bank_code = request.bank_code
    if not bank_code:
        try:
            banks = await client.get_supported_banks()
        except MonnifyException as exc:
            raise HTTPException(status_code=502, detail=str(exc.message)) from exc

        bank_name = request.bank_name.strip().lower() if request.bank_name else ""
        bank_match = next(
            (
                bank for bank in banks
                if str(bank.get("bankName", "")).strip().lower() == bank_name
                or str(bank.get("bankCode", "")).strip() == request.bank_name.strip()
            ),
            None,
        )
        if not bank_match or not bank_match.get("bankCode"):
            raise HTTPException(status_code=400, detail="Selected bank is not supported.")
        bank_code = bank_match["bankCode"]

    reference = f"WD_TXN_{uuid.uuid4().hex[:12].upper()}"

    transaction = models.Transaction(
        user_id=current_user.id,
        type="WITHDRAWAL",
        amount=request.amount,
        fee_deducted=0.0,
        net_payout=request.amount,
        status="PENDING",
        monnify_payment_ref=reference,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    try:
        transfer_data = await client.initiate_single_transfer(
            amount=request.amount,
            bank_code=bank_code,
            account_number=request.account_number,
            reference=reference,
            narration=request.narration,
            account_name=request.account_name,
        )
        status_value = str(
            transfer_data.get("status")
            or transfer_data.get("transferStatus")
            or transfer_data.get("statusCode")
            or "PENDING_AUTHORIZATION"
        ).upper()

        if status_value in {"SUCCESS", "COMPLETED", "PAID"}:
            transaction.status = "COMPLETED"
            current_user.wallet_balance -= request.amount
            db.commit()
            return {
                "status": "success",
                "message": "Withdrawal completed successfully.",
                "reference": reference,
                "requires_otp": False,
                "new_wallet_balance": current_user.wallet_balance,
            }

        transaction.status = "PENDING"
        db.commit()
        return {
            "status": "pending_authorization",
            "message": "Monnify requires OTP authorization for this payout.",
            "reference": reference,
            "requires_otp": True,
            "transfer_status": status_value,
        }
    except MonnifyException as exc:
        transaction.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc.message)) from exc


@router.get("/banks")
async def get_supported_banks(
    current_user: models.User = Depends(get_current_user),
):
    try:
        banks = await client.get_supported_banks()
        return {"status": "success", "banks": banks}
    except MonnifyException as exc:
        logger.error("Failed to fetch supported banks: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc.message)) from exc


@router.post("/authorize")
async def authorize_payout(
    request: PayoutAuthorizeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    transaction = (
        db.query(models.Transaction)
        .filter(models.Transaction.monnify_payment_ref == request.reference)
        .filter(models.Transaction.user_id == current_user.id)
        .first()
    )
    if not transaction:
        raise HTTPException(status_code=404, detail="Payout reference not found")

    try:
        transfer_data = await client.authorize_transfer(request.reference, request.otp)
        status_value = str(
            transfer_data.get("status")
            or transfer_data.get("transferStatus")
            or transfer_data.get("statusCode")
            or "PENDING"
        ).upper()

        if status_value in {"SUCCESS", "COMPLETED", "PAID"}:
            if transaction.status != "COMPLETED":
                transaction.status = "COMPLETED"
                current_user.wallet_balance -= transaction.amount
            db.commit()
            return {
                "status": "success",
                "message": "Withdrawal completed successfully.",
                "reference": request.reference,
                "new_wallet_balance": current_user.wallet_balance,
            }

        transaction.status = "FAILED"
        db.commit()
        return {
            "status": "failed",
            "message": "OTP authorization did not complete the payout.",
            "reference": request.reference,
            "transfer_status": status_value,
        }
    except MonnifyException as exc:
        transaction.status = "FAILED"
        db.commit()
        raise HTTPException(status_code=400, detail=str(exc.message)) from exc
