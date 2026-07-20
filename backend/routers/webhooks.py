import hmac
import hashlib
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

try:
    from backend.app.database import get_db
    from backend.app import models
    from backend.app.config import settings
except ImportError:
    from app.database import get_db
    import app.models as models
    from app.config import settings

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


def verify_monnify_signature(raw_body: bytes, signature: str, secret: str) -> bool:
    """
    Verify the Monnify signature using HMAC-SHA512.
    """
    if not secret:
        return False
    calculated = hmac.new(
        key=secret.encode("utf-8"),
        msg=raw_body,
        digestmod=hashlib.sha512
    ).hexdigest()
    return hmac.compare_digest(calculated, signature)


@router.post("/monnify")
async def monnify_webhook(
    request: Request,
    monnify_signature: str = Header(None, alias="monnify-signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook listener for Monnify status updates.
    """
    # 1. Get raw request body
    body_bytes = await request.body()
    
    # 2. Signature verification
    is_sandbox = "sandbox" in settings.MONNIFY_BASE_URL.lower()
    
    if not monnify_signature:
        if is_sandbox:
            logger.warning("monnify-signature header missing in sandbox environment. Skipping verification.")
        else:
            logger.error("Missing monnify-signature header in production.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing monnify-signature header"
            )
    else:
        if not verify_monnify_signature(body_bytes, monnify_signature, settings.MONNIFY_SECRET_KEY):
            logger.error("Signature verification failed.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature"
            )
            
    # 3. Parse JSON body
    try:
        payload = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse JSON body: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )
        
    event_data = payload.get("eventData", {})
    reference = event_data.get("reference")
    event_status = event_data.get("status")
    
    if not reference or not event_status:
        logger.warning("Webhook payload missing reference or status.")
        return {"status": "ignored", "detail": "Missing reference or status"}
        
    logger.info(f"Received Monnify webhook event for reference: {reference}, status: {event_status}")
    
    # 4. Find the transaction
    transaction = db.query(models.Transaction).filter(
        models.Transaction.monnify_payment_ref == reference
    ).first()
    
    if not transaction:
        logger.warning(f"Transaction not found for reference: {reference}")
        # Return 200 OK so Monnify doesn't keep retrying requests for unknown transactions
        return {"status": "ignored", "detail": f"Transaction not found for reference {reference}"}
        
    # 5. Process status updates
    status_upper = event_status.upper()
    
    if status_upper == "SUCCESS":
        if transaction.status != "COMPLETED":
            transaction.status = "COMPLETED"
            # Deduct the user's wallet balance if it hasn't been deducted yet
            user = transaction.user
            if user:
                user.wallet_balance -= transaction.amount
                logger.info(f"Deducted {transaction.amount} from user {user.id}. New balance: {user.wallet_balance}")
            db.commit()
            db.refresh(transaction)
            logger.info(f"Transaction {reference} status updated to COMPLETED.")
        else:
            logger.info(f"Transaction {reference} was already COMPLETED. No balance change.")
            
    elif status_upper == "FAILED":
        if transaction.status != "FAILED":
            transaction.status = "FAILED"
            db.commit()
            db.refresh(transaction)
            logger.info(f"Transaction {reference} status updated to FAILED.")
        else:
            logger.info(f"Transaction {reference} was already FAILED.")
            
    else:
        logger.info(f"Transaction {reference} received unhandled status update: {event_status}")
        
    return {"status": "success", "reference": reference, "updated_status": transaction.status}
