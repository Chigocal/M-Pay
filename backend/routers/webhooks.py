import hmac
import hashlib
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

try:
    from backend.app.database import get_db
    from backend.app import models, schemas
    from backend.app.config import settings
except ImportError:
    from app.database import get_db
    import app.models as models
    import app.schemas as schemas
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


def verify_persona_signature(raw_body: bytes, signature_header: str, secret: str) -> bool:
    """
    Verify the Persona webhook signature using HMAC-SHA256.
    """
    if not secret or not signature_header:
        return False
    try:
        # Signature header format: "t=TIMESTAMP,v1=SIGNATURE"
        parts = dict(part.split('=') for part in signature_header.split(','))
        timestamp = parts.get('t')
        received_sig = parts.get('v1')
        if not timestamp or not received_sig:
            return False
        
        # Message construction: <timestamp>.<raw_body>
        message = f"{timestamp}.{raw_body.decode('utf-8')}".encode('utf-8')
        
        calculated = hmac.new(
            key=secret.encode("utf-8"),
            msg=message,
            digestmod=hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(calculated, received_sig)
    except Exception as e:
        logger.error(f"Error validating Persona signature: {e}")
        return False


@router.post("/persona")
async def persona_webhook(
    payload: schemas.PersonaWebhookPayload,
    request: Request,
    persona_signature: str = Header(None, alias="Persona-Signature"),
    db: Session = Depends(get_db)
):
    """
    Webhook listener for Persona KYC status updates.
    """
    body_bytes = await request.body()
    
    # 1. Signature verification
    is_sandbox = "sandbox" in settings.PERSONA_API_KEY.lower()
    
    if not persona_signature:
        if is_sandbox:
            logger.warning("Persona-Signature header missing in sandbox. Skipping verification.")
        else:
            logger.error("Missing Persona-Signature header in production.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Persona-Signature header"
            )
    else:
        if not verify_persona_signature(body_bytes, persona_signature, settings.PERSONA_WEBHOOK_SECRET):
            if is_sandbox:
                logger.warning("Persona signature verification failed but in Sandbox. Proceeding anyway.")
            else:
                logger.error("Persona signature verification failed.")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid signature"
                )
                
    # 2. Parse JSON payload (already parsed and validated by FastAPI, but we keep the structure for compatibility)
    event_data = payload.data
    event_attributes = event_data.attributes
    event_name = event_attributes.name
    
    logger.info(f"Received Persona webhook event: {event_name}")
    
    # Process inquiry.completed event
    if event_name == "inquiry.completed":
        inquiry_data = event_attributes.payload.data
        inquiry_id = inquiry_data.id
        inquiry_attributes = inquiry_data.attributes
        reference_id = inquiry_attributes.reference_id
        inquiry_status = inquiry_attributes.status
        
        logger.info(f"Processing completed inquiry {inquiry_id} for user reference {reference_id} with status {inquiry_status}")
        
        # Look up the user by reference_id first
        user = None
        if reference_id:
            try:
                user = db.query(models.User).filter(models.User.id == int(reference_id)).first()
            except ValueError:
                pass
                
        # Fallback: look up by persona_inquiry_id
        if not user:
            user = db.query(models.User).filter(models.User.persona_inquiry_id == inquiry_id).first()
            
        if not user:
            logger.error(f"User not found for Persona inquiry {inquiry_id} (ref: {reference_id})")
            return {"status": "ignored", "detail": "User not found"}
            
        # Update user verification fields if successfully completed
        if inquiry_status.lower() == "completed":
            fields = inquiry_attributes.fields
            first_name = ""
            last_name = ""
            if fields:
                if fields.name_first:
                    first_name = fields.name_first.get("value", "")
                if fields.name_last:
                    last_name = fields.name_last.get("value", "")
            
            full_name = f"{first_name} {last_name}".strip()
            
            user.is_verified = True
            if full_name:
                user.verified_legal_name = full_name
            user.persona_inquiry_id = inquiry_id
            
            db.commit()
            db.refresh(user)
            logger.info(f"User {user.id} verified successfully via Persona. Legal Name: {user.verified_legal_name}")
            
    return {"status": "success", "event": event_name}
