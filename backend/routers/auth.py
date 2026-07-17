import random
import jwt
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
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


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Register a new local user with email, phone number, and password.
    Verifies that duplicates do not exist.
    """
    # Check if email is already registered
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )

    # Check if phone number is already registered
    existing_phone = db.query(models.User).filter(models.User.phone_number == user_data.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number is already registered."
        )

    # Create new user record
    hashed_password = pwd_context.hash(user_data.password)
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
    
    # Print simulated email OTP to console
    print(f"SIMULATED EMAIL: OTP for {new_user.email} is {otp}")
    
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
