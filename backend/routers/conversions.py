import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db
    from backend.app import models
    from backend.routers.auth import get_current_user
    from backend.services.aggregator import (
        check_quota,
        generate_otp,
        verify_otp,
        transfer_airtime,
        get_conversion_rate,
        AggregatorException,
    )
except ImportError:
    from app.database import get_db
    import app.models as models
    from routers.auth import get_current_user
    from services.aggregator import (
        check_quota,
        generate_otp,
        verify_otp,
        transfer_airtime,
        get_conversion_rate,
        AggregatorException,
    )

# Setup APIRouter
router = APIRouter(prefix="/conversions", tags=["Conversions"])


# Request Schemas
class ConversionInitiateRequest(BaseModel):
    network: str = Field(..., description="Mobile network provider, e.g., MTN, AIRTEL, GLO, 9MOBILE")
    phone_number: str = Field(..., description="Sender's mobile number")
    amount: int = Field(..., description="Amount of airtime to convert")


class ConversionVerifyRequest(BaseModel):
    network: str = Field(..., description="Mobile network provider, e.g., MTN, AIRTEL, GLO, 9MOBILE")
    phone_number: str = Field(..., description="Sender's mobile number")
    amount: int = Field(..., description="Amount of airtime to convert")
    otp: str = Field(..., description="6-digit OTP verification code received via SMS")
    pin: str = Field(..., description="Sender's mobile network transfer PIN")


@router.post("/initiate")
async def initiate_conversion(
    request: ConversionInitiateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Check recipient quota and trigger SMS OTP verification for the airtime sender.
    Registers a pending conversion transaction in the database.
    """
    # 1. Validate that amount >= 50
    if request.amount < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum conversion amount is ₦50."
        )

    try:
        # 2. Check quota availability
        quota_available = await check_quota(request.network, request.amount)
        if not quota_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Recipient quota full or network unavailable. Please try again later."
            )

        # 3. Fire the live SMS OTP to user's phone
        await generate_otp(request.network, request.phone_number)

        # 4. Create new Transaction record
        new_transaction = models.Transaction(
            user_id=current_user.id,
            type="CONVERSION",
            network=request.network.upper(),
            amount=float(request.amount),
            fee_deducted=0.0,
            net_payout=0.0,  # calculated and stored upon verification
            status="PENDING"
        )
        
        db.add(new_transaction)
        db.commit()

        # 5. Return success response
        return {
            "status": "success",
            "message": "OTP sent successfully to your phone number."
        }

    except AggregatorException as e:
        # Global error mapping for aggregator exceptions
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


@router.post("/verify")
async def verify_conversion(
    request: ConversionVerifyRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Verify the SMS OTP, perform the final airtime transfer pull,
    and update transaction details and user wallet balance.
    """
    try:
        # 1. Verify the OTP code
        verify_response = await verify_otp(
            network=request.network,
            phone_number=request.phone_number,
            otp=request.otp
        )

        # 2. Extract sessionId from the response payload
        session_id = verify_response.get("data", {}).get("sessionId")
        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification failed. Aggregator session ID was not generated."
            )

        # 3. Generate unique transaction reference string
        reference = f"TXN_{uuid.uuid4().hex[:12].upper()}"

        # 4. Execute final aggregator airtime transfer pull
        transfer_response = await transfer_airtime(
            network=request.network,
            phone_number=request.phone_number,
            amount=request.amount,
            reference=reference,
            pin=request.pin,
            session_id=session_id
        )

        # Explicitly ensure that transfer_response.get("code") == 2000
        if transfer_response.get("code") != 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=transfer_response.get("message", "Airtime transfer failed on aggregator side.")
            )

        # 5. Calculate payout cash amount using network rate
        rate = get_conversion_rate(request.network)
        payout_amount = float(request.amount) * rate

        # 6. Retrieve corresponding pending transaction record
        db_transaction = db.query(models.Transaction).filter(
            models.Transaction.user_id == current_user.id,
            models.Transaction.network == request.network.upper(),
            models.Transaction.amount == float(request.amount),
            models.Transaction.status == "PENDING",
            models.Transaction.type == "CONVERSION"
        ).order_by(models.Transaction.created_at.desc()).first()

        if not db_transaction:
            # Fallback: create a new transaction record if none was matched
            db_transaction = models.Transaction(
                user_id=current_user.id,
                type="CONVERSION",
                network=request.network.upper(),
                amount=float(request.amount),
                fee_deducted=0.0,
                status="PENDING"
            )
            db.add(db_transaction)

        # 7. Update transaction values
        db_transaction.status = "COMPLETED"
        db_transaction.net_payout = payout_amount
        db_transaction.aggregator_session_id = session_id

        # 8. Update current authenticated user wallet balance
        current_user.wallet_balance += payout_amount

        # 9. Commit changes
        db.commit()
        db.refresh(current_user)

        # 10. Return success response
        return {
            "status": "success",
            "reference": reference,
            "amount_transferred": request.amount,
            "payout_amount": payout_amount,
            "new_wallet_balance": current_user.wallet_balance
        }

    except AggregatorException as e:
        # Global error mapping for aggregator exceptions
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
