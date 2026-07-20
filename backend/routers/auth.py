import random
import jwt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

try:
    from backend.app.database import get_db
    from backend.app import models, schemas
    from backend.app.config import settings
except ImportError:
    from app.database import get_db
    import app.models as models
    import app.schemas as schemas
    from app.config import settings

# JWT Configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Password Hashing Setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# APIRouter setup
router = APIRouter(prefix="/auth", tags=["Authentication"])


# Local Authentication Schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: schemas.UserResponse


# JWT Token Helper
def create_access_token(data: dict) -> str:
    """
    Generates a thread-safe JWT access token signed with our settings secret key.
    """
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": int(expire.timestamp())})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> models.User:
    """
    Decodes the JWT bearer token and retrieves the current authenticated user.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials."
            )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials."
        )
        
    user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found."
        )
    return user


def send_email_otp(email: str, otp: str):
    """
    Sends verification OTP to the user's email address.
    If SMTP details are not configured, it simulates sending by printing to console.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD or "your_email" in settings.SMTP_USER or "your_app_password" in settings.SMTP_PASSWORD:
        print("\n" + "="*80)
        print(f" [SMTP SIMULATION] OTP Code for {email} is: {otp}")
        print(" (To send real emails, replace placeholder variables in .env)")
        print("="*80 + "\n")
        return
    
    sender_email = settings.SMTP_FROM or settings.SMTP_USER
    receiver_email = email
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "Verify your Data2Cash Account"
    message["From"] = sender_email
    message["To"] = receiver_email
    
    text = f"Your verification code is: {otp}\nThis code will expire in 10 minutes."
    html = f"""\
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #030F07; color: #F0FAF0; padding: 20px;">
        <h2 style="color: #AAFF45;">Verify your Data2Cash Account</h2>
        <p>Thank you for signing up with Data2Cash. Please use the verification code below to complete your registration:</p>
        <div style="background-color: #0C2318; border: 1px solid #143324; padding: 15px; text-align: center; border-radius: 10px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #AAFF45; letter-spacing: 5px;">{otp}</span>
        </div>
        <p style="font-size: 12px; color: #5A8870;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
      </body>
    </html>
    """
    
    message.attach(MIMEText(text, "plain"))
    message.attach(MIMEText(html, "html"))
    
    try:
        print(f"\n[SMTP CONNECTING] Connecting to {settings.SMTP_HOST}:{settings.SMTP_PORT} using {sender_email}...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(sender_email, receiver_email, message.as_string())
        print("\n" + "="*80)
        print(f" [SMTP SUCCESS] Verification email sent successfully to: {email}")
        print("="*80 + "\n")
    except Exception as e:
        print("\n" + "!"*80)
        print(f" [SMTP FAILURE] Failed to send verification email to {email}: {e}")
        print(f" [SMTP FALLBACK] Printing code here to bypass: {otp}")
        print("!"*80 + "\n")


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new local user with email, phone number, and password.
    Verifies that duplicates do not exist unless the existing user is unverified,
    in which case we resend the OTP.
    """
    hashed_password = pwd_context.hash(user_data.password)

    # Check if email is already registered
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        if existing_email.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already registered."
            )
        else:
            # Update existing unverified user registration and generate new OTP
            otp = str(random.randint(100000, 999999))
            existing_email.otp_code = otp
            existing_email.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
            existing_email.hashed_password = hashed_password
            existing_email.phone_number = user_data.phone_number
            
            send_email_otp(existing_email.email, otp)
            db.commit()
            db.refresh(existing_email)
            return existing_email

    # Check if phone number is already registered
    existing_phone = db.query(models.User).filter(models.User.phone_number == user_data.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered."
        )

    # Create new user record
    new_user = models.User(
        email=user_data.email,
        phone_number=user_data.phone_number,
        hashed_password=hashed_password,
        auth_provider="local",
        is_verified=False
    )
    
    # Generate 6-digit OTP code
    otp = str(random.randint(100000, 999999))
    new_user.otp_code = otp
    new_user.otp_expiry = datetime.utcnow() + timedelta(minutes=10)
    
    # Send verification email
    send_email_otp(new_user.email, otp)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/verify-otp")
def verify_otp(payload: schemas.OTPVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify the 6-digit OTP verification code for a user account.
    Marks the user as verified if OTP is valid and not expired.
    """
    # Query user by email
    db_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email address does not exist."
        )

    # Verify if OTP exists, matches, and is not expired
    if not db_user.otp_code or db_user.otp_code != payload.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code."
        )

    # Check for expiration
    now = datetime.now(timezone.utc) if db_user.otp_expiry.tzinfo else datetime.utcnow()
    if db_user.otp_expiry < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired."
        )

    # Verification successful, update user status and clear OTP details
    db_user.is_verified = True
    db_user.otp_code = None
    db_user.otp_expiry = None
    
    db.commit()
    return {"message": "OTP verified successfully. User is now verified."}


@router.post("/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate local users and issue a JWT token.
    """
    # Find user by email
    db_user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    # Check provider type
    if db_user.auth_provider != "local" or not db_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {db_user.auth_provider} authentication. Please login via that provider."
        )

    # Verify password hash
    if not pwd_context.verify(credentials.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email address or password."
        )

    # Issue access token
    access_token = create_access_token(data={"sub": str(db_user.id), "email": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }


@router.post("/google", response_model=TokenResponse)
def google_auth(request_data: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Verify Google ID token. Find or create the user and issue a JWT token.
    """
    try:
        # Verify the ID token using Google API client
        idinfo = id_token.verify_oauth2_token(
            request_data.token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )

        email = idinfo.get("email")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token payload does not contain a valid email."
            )

        google_sub = idinfo.get("sub")
        first_name = idinfo.get("given_name", "")
        last_name = idinfo.get("family_name", "")
        legal_name = f"{first_name} {last_name}".strip() or None

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid Google ID token: {str(e)}"
        )

    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == email).first()

    if not db_user:
        # Create a new user since it does not exist
        # Since phone number is a non-nullable unique field, we provision a placeholder
        # and expect the user to update/verify it during profile completion.
        db_user = models.User(
            email=email,
            phone_number=f"google_{google_sub}",
            hashed_password=None,
            auth_provider="google",
            verified_legal_name=legal_name,
            is_verified=False
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
    else:
        # If the user exists, but registered with a local account previously,
        # we can link or fail gracefully depending on preference. Here we allow it
        # or verify they login correctly.
        pass

    # Issue access token
    access_token = create_access_token(data={"sub": str(db_user.id), "email": db_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }
