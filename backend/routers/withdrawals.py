import uuid
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

try:
    from backend.app.database import get_db
    from backend.app import models
    from backend.routers.auth import get_current_user
    from backend.services.monnify import (
        initiate_single_transfer,
        MonnifyException
    )
except ImportError:
    from app.database import get_db
    import app.models as models
    from routers.auth import get_current_user
    from services.monnify import (
        initiate_single_transfer,
        MonnifyException
    )

router = APIRouter(prefix="/withdrawals", tags=["Withdrawals"])


class PayoutTriggerRequest(BaseModel):
    amount: float = Field(..., description="The amount to disburse/withdraw.")
    bank_code: str = Field(..., description="The destination bank code.")
    account_number: str = Field(..., description="The destination account number.")
    account_name: str = Field(..., description="The destination account name.")
    narration: str = Field(..., description="Payment narration.")


@router.post("/trigger-payout")
async def trigger_payout(
    request: PayoutTriggerRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Initiate a withdrawal disbursement to the user's personal bank account.
    """
    # Step 1: Validate wallet balance
    if current_user.wallet_balance < request.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient wallet balance"
        )

    # Step 2: Generate a unique transaction reference
    unique_ref = f"WD_TXN_{uuid.uuid4().hex[:12].upper()}"

    # Step 3: Create a new Transaction record in the database
    new_transaction = models.Transaction(
        user_id=current_user.id,
        type="WITHDRAWAL",
        amount=request.amount,
        fee_deducted=0.0,
        net_payout=request.amount,
        status="PENDING",
        monnify_payment_ref=unique_ref
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)

    # Step 4: Wrap the Monnify call in a try...except block
    try:
        transfer_data = await initiate_single_transfer(
            amount=request.amount,
            reference=unique_ref,
            bank_code=request.bank_code,
            account_number=request.account_number,
            account_name=request.account_name,
            narration=request.narration
        )

        status_str = transfer_data.get("status")
        # If the transfer is successful (status is SUCCESS or COMPLETED)
        if status_str in ("SUCCESS", "COMPLETED"):
            new_transaction.status = "COMPLETED"
            current_user.wallet_balance -= request.amount
            db.commit()
            db.refresh(new_transaction)
            
            return {
                "status": "success",
                "message": "Withdrawal completed successfully.",
                "reference": unique_ref,
                "amount": request.amount,
                "new_wallet_balance": current_user.wallet_balance,
                "transfer_status": status_str
            }
        else:
            # Handle other cases (e.g. PENDING, PENDING_AUTHORIZATION) if not raising an exception
            # We don't deduct the wallet balance yet since it is not COMPLETED
            new_transaction.status = "PENDING"
            db.commit()
            
            return {
                "status": "success",
                "message": "Withdrawal request is pending authorization/processing.",
                "reference": unique_ref,
                "amount": request.amount,
                "transfer_status": status_str
            }

    except MonnifyException as e:
        # If a MonnifyException is caught, mark transaction as FAILED
        new_transaction.status = "FAILED"
        db.commit()
        
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payout failed: {e.message}"
        )
