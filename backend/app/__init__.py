import sys
# Namespace aliasing to prevent duplicate imports of app and backend.app submodules
for sub in ["config", "database", "models", "schemas", ""]:
    b_name = f"backend.app.{sub}" if sub else "backend.app"
    a_name = f"app.{sub}" if sub else "app"
    if b_name in sys.modules and a_name not in sys.modules:
        sys.modules[a_name] = sys.modules[b_name]
    elif a_name in sys.modules and b_name not in sys.modules:
        sys.modules[b_name] = sys.modules[a_name]

from .config import settings
from .database import engine, SessionLocal, Base, get_db
from .models import User, Transaction
from .schemas import (
    UserCreate,
    GoogleLoginRequest,
    OTPVerifyRequest,
    UserResponse,
    ConversionRequest,
    WithdrawalRequest,
    TransactionResponse,
    PersonaWebhookPayload,
)

__all__ = [
    "settings",
    "engine",
    "SessionLocal",
    "Base",
    "get_db",
    "User",
    "Transaction",
    "UserCreate",
    "GoogleLoginRequest",
    "OTPVerifyRequest",
    "UserResponse",
    "ConversionRequest",
    "WithdrawalRequest",
    "TransactionResponse",
    "PersonaWebhookPayload",
]
