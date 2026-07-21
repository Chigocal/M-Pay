import uuid
import asyncio
import re
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db, SessionLocal
    from backend.app import models
    from backend.routers.auth import get_current_user
    from backend.services.aggregator import (
        check_quota,
        generate_otp,
        verify_otp,
        transfer_airtime,
        get_conversion_rate,
        AggregatorException,
        login_with_session_id,
    )
except ImportError:
    from app.database import get_db, SessionLocal
    import app.models as models
    from routers.auth import get_current_user
    from services.aggregator import (
        check_quota,
        generate_otp,
        verify_otp,
        transfer_airtime,
        get_conversion_rate,
        AggregatorException,
        login_with_session_id,
    )

# Setup APIRouter
router = APIRouter(prefix="/conversions", tags=["Conversions"])


# Request Schemas
class ConversionInitiateRequest(BaseModel):
    network: str = Field(..., description="Mobile network provider, e.g., MTN, AIRTEL, GLO, 9MOBILE")
    phone_number: str = Field(..., description="Sender's mobile number")
    amount: int = Field(..., description="Amount of airtime to convert")


class ConversionVerifyOTPRequest(BaseModel):
    network: str = Field(..., description="Mobile network provider, e.g., MTN, AIRTEL, GLO, 9MOBILE")
    phone_number: str = Field(..., description="Sender's mobile number")
    otp: str = Field(..., description="6-digit OTP verification code received via SMS")


class ConversionExecuteTransferRequest(BaseModel):
    network: str = Field(..., description="Mobile network provider, e.g., MTN, AIRTEL, GLO, 9MOBILE")
    phone_number: str = Field(..., description="Sender's mobile number")
    amount: int = Field(..., description="Amount of airtime to convert")
    pin: str = Field(..., description="Sender's mobile network transfer PIN")
    session_id: str = Field(..., description="Active session ID received from OTP verification")
    initial_balance: Optional[float] = Field(None, description="Sender's SIM airtime balance before conversion")


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

        # 5. Calculate estimated payout for UI and return success response
        estimated_payout = float(request.amount) * get_conversion_rate(request.network)

        return {
            "status": "success",
            "message": "OTP sent successfully to your phone number.",
            "estimated_payout": estimated_payout
        }

    except AggregatorException as e:
        # Global error mapping for aggregator exceptions
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


@router.get("/transaction/{transaction_id}")
def get_transaction_status(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Return a user's transaction record so the frontend can poll for status updates."""
    db_transaction = db.query(models.Transaction).filter(
        models.Transaction.id == transaction_id,
        models.Transaction.user_id == current_user.id
    ).first()

    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found."
        )

    # Return the DB model directly; Pydantic response models can be applied by the frontend
    return db_transaction


@router.post("/verify-otp")
async def verify_conversion_otp(
    request: ConversionVerifyOTPRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Verify the SMS OTP sent to the user's phone and return the detected airtime balance.
    """
    try:
        # 1. Verify the OTP code
        verify_response = await verify_otp(
            network=request.network,
            phone_number=request.phone_number,
            otp=request.otp
        )

        # 2. Extract sessionId and airtimeBalance from the response payload
        data = verify_response.get("data", {})
        session_id = data.get("sessionId")
        airtime_balance = data.get("airtimeBalance")

        if not session_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification failed. Aggregator session ID was not generated."
            )

        parsed_initial_balance = _parse_balance(airtime_balance)
        print(
            f"[OTP VERIFY] network={request.network} phone={request.phone_number} "
            f"raw_airtime_balance={airtime_balance} parsed_airtime_balance={parsed_initial_balance}"
        )

        return {
            "status": "success",
            "message": "OTP verified successfully.",
            "session_id": session_id,
            "airtime_balance": airtime_balance
        }

    except AggregatorException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )


def _parse_balance(value: Optional[object]) -> Optional[float]:
    """Normalize balance strings such as '₦228.69' or '228.69' into a float."""
    if value is None:
        return None

    if isinstance(value, (int, float)):
        return float(value)

    if isinstance(value, str):
        text = value.strip()
        if not text:
            return None
        normalized = re.sub(r"[^0-9.\-]", "", text)
        if not normalized or normalized in {"-", "."}:
            return None
        try:
            return float(normalized)
        except ValueError:
            return None

    return None


async def verify_sim_debit(
    user_id: int,
    transaction_id: int,
    network: str,
    phone_number: str,
    session_id: str,
    amount: float,
    payout_amount: float,
    initial_balance: Optional[float]
):
    """
    Check the SIM balance up to five times to confirm whether the airtime debit actually occurred.
    If the debit is confirmed, mark the transaction as COMPLETED and credit the user's wallet.
    Otherwise, after the final check, mark the transaction as FAILED.
    """
    # 1. Wait briefly before the first balance check to allow the USSD transfer to settle
    await asyncio.sleep(10.0)

    db = SessionLocal()
    try:
        db_transaction = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
        db_user = db.query(models.User).filter(models.User.id == user_id).first()

        if not db_transaction or not db_user:
            return

        # Double check status to avoid double processing
        if db_transaction.status != "PENDING":
            return

        parsed_initial_balance = _parse_balance(initial_balance)
        expected_min_balance = None
        if parsed_initial_balance is not None:
            expected_min_balance = parsed_initial_balance - amount

        debit_confirmed = False
        last_seen_balance = None

        for attempt in range(5):
            try:
                login_response = await login_with_session_id(
                    network=network,
                    phone_number=phone_number,
                    session_id=session_id
                )

                data = login_response.get("data", {})
                current_balance = data.get("airtimeBalance")
                parsed_balance = _parse_balance(current_balance)
                last_seen_balance = parsed_balance

                print(
                    f"[RECONCILIATION ATTEMPT {attempt + 1}] raw_balance={current_balance} "
                    f"parsed_balance={parsed_balance} expected_min_balance={expected_min_balance}"
                )

                if parsed_balance is not None:
                    if expected_min_balance is not None:
                        if parsed_balance <= expected_min_balance:
                            debit_confirmed = True
                            break
                    elif parsed_initial_balance is not None and parsed_balance < parsed_initial_balance:
                        debit_confirmed = True
                        break

            except Exception as api_err:
                print(f"[RECONCILIATION ATTEMPT {attempt + 1}] API error while checking balance: {api_err}")

            if attempt < 4:
                await asyncio.sleep(2.0)

        if debit_confirmed:
            db_transaction.status = "COMPLETED"
            db_transaction.net_payout = payout_amount
            db_user.wallet_balance += payout_amount
            db.commit()
            print(
                f"[RECONCILIATION SUCCESS] Transaction {transaction_id} verified. "
                f"Balance dropped to {last_seen_balance}. Wallet credited with ₦{payout_amount}."
            )
        else:
            db_transaction.status = "FAILED"
            db.commit()
            print(
                f"[RECONCILIATION FAILED] Transaction {transaction_id} failed. "
                f"Balance was not reduced by the expected amount after 5 checks. Last seen balance: {last_seen_balance}."
            )

    finally:
        db.close()


@router.post("/execute-transfer")
async def execute_conversion_transfer(
    request: ConversionExecuteTransferRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Perform the final airtime transfer pull using the session ID and telecom PIN,
    then credit the user's wallet balance.
    """
    # Calculate payout cash amount using network rate
    rate = get_conversion_rate(request.network)
    payout_amount = float(request.amount) * rate
    reference = f"TXN_{uuid.uuid4().hex[:12].upper()}"

    try:
        # 1. Execute final aggregator airtime transfer pull
        transfer_response = await transfer_airtime(
            network=request.network,
            phone_number=request.phone_number,
            amount=request.amount,
            reference=reference,
            pin=request.pin,
            session_id=request.session_id
        )

        # Explicitly ensure that transfer_response.get("code") == 2000
        if transfer_response.get("code") != 2000:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=transfer_response.get("message", "Airtime transfer failed on aggregator side.")
            )

        # 2. Retrieve corresponding pending transaction record
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

        # 3. Update transaction values and keep it pending until reconciliation confirms the balance drop
        db_transaction.net_payout = payout_amount
        db_transaction.aggregator_session_id = request.session_id

        # 4. Commit the pending transaction so reconciliation can update it later.
        db.commit()
        db.refresh(db_transaction)

        # 5. Schedule background balance reconciliation
        background_tasks.add_task(
            verify_sim_debit,
            current_user.id,
            db_transaction.id,
            request.network,
            request.phone_number,
            request.session_id,
            float(request.amount),
            payout_amount,
            request.initial_balance
        )

        return {
            "status": "pending_reconciliation",
            "reference": reference,
            "amount_transferred": request.amount,
            "payout_amount": payout_amount,
            "new_wallet_balance": current_user.wallet_balance,
            "message": "Reconciliation check in progress. Please check back in a few moments.",
            "transaction_id": db_transaction.id,
            "transaction_status": db_transaction.status
        }

    except AggregatorException as e:
        # Check if the error message is the specific false-negative response
        if "You were not debited. Please try again later!" in e.message:
            # Retrieve corresponding pending transaction record
            db_transaction = db.query(models.Transaction).filter(
                models.Transaction.user_id == current_user.id,
                models.Transaction.network == request.network.upper(),
                models.Transaction.amount == float(request.amount),
                models.Transaction.status == "PENDING",
                models.Transaction.type == "CONVERSION"
            ).order_by(models.Transaction.created_at.desc()).first()

            if not db_transaction:
                db_transaction = models.Transaction(
                    user_id=current_user.id,
                    type="CONVERSION",
                    network=request.network.upper(),
                    amount=float(request.amount),
                    fee_deducted=0.0,
                    net_payout=payout_amount,
                    status="PENDING"
                )
                db.add(db_transaction)
                db.commit()
                db.refresh(db_transaction)
            else:
                db_transaction.net_payout = payout_amount
                db_transaction.aggregator_session_id = request.session_id
                db.commit()

            # Schedule background reconciliation check
            background_tasks.add_task(
                verify_sim_debit,
                current_user.id,
                db_transaction.id,
                request.network,
                request.phone_number,
                request.session_id,
                float(request.amount),
                payout_amount,
                request.initial_balance
            )

            return {
                "status": "pending_reconciliation",
                "reference": reference,
                "amount_transferred": request.amount,
                "payout_amount": payout_amount,
                "new_wallet_balance": current_user.wallet_balance,
                "message": "Reconciliation check in progress. Please check back in a few moments.",
                "transaction_id": db_transaction.id,
                "transaction_status": db_transaction.status
            }

        # Otherwise raise the normal exception
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
