from typing import Optional
import os
import sys
from pathlib import Path
from pydantic import Field, AliasChoices, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict

# Locate the root directory where the .env file resides
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_FILE_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    """
    Application Settings configuration class powered by Pydantic BaseSettings.
    Automatically loads environment variables from environment and falls back
    to the root .env file.
    """
    
    # Database configuration
    DATABASE_URL: str = Field(
        default="sqlite:///./airtime_cash.db",
        description="Database connection URL"
    )
    
    # Aggregator Credentials
    AGGREGATOR_BASE_URL: str = Field(
        description="Base URL for the airtime aggregator API"
    )
    AGGREGATOR_API_KEY: str = Field(
        validation_alias=AliasChoices("AGGREGATOR_API_KEY", "AGGREGATOR_BEARER_TOKEN"),
        description="API Key or Bearer Token for the airtime aggregator service"
    )
    
    # Monnify Credentials
    MONNIFY_BASE_URL: str = Field(
        description="Base URL for the Monnify API"
    )
    MONNIFY_API_KEY: str = Field(
        description="Monnify API Key"
    )
    MONNIFY_SECRET_KEY: str = Field(
        description="Monnify API Secret Key"
    )
    MONNIFY_CONTRACT_CODE: str = Field(
        description="Monnify Contract Code"
    )
    MONNIFY_WALLET_ACCOUNT_NUMBER: str = Field(
        default="9999999999",
        description="Monnify Source Wallet Account Number"
    )
    
    # Persona Credentials
    PERSONA_API_KEY: str = Field(
        description="Persona API Key"
    )
    PERSONA_WEBHOOK_SECRET: str = Field(
        description="Persona Webhook Signature Secret"
    )
    
    # Google OAuth Credentials
    GOOGLE_CLIENT_ID: str = Field(
        description="Google Client ID for OAuth authentication"
    )
    
    # JWT Secrets
    JWT_SECRET_KEY: str = Field(
        description="Secret key used for signing JWT access tokens"
    )
    
    # SMTP configuration for real email OTPs
    SMTP_HOST: str = Field(
        default="smtp.gmail.com",
        description="SMTP server host name"
    )
    SMTP_PORT: int = Field(
        default=587,
        description="SMTP server port number"
    )
    SMTP_USER: Optional[str] = Field(
        default=None,
        description="SMTP server username"
    )
    SMTP_PASSWORD: Optional[str] = Field(
        default=None,
        description="SMTP server password"
    )
    SMTP_FROM: Optional[str] = Field(
        default=None,
        description="SMTP sender email address"
    )
    
    model_config = SettingsConfigDict(
        env_file=ENV_FILE_PATH,
        env_file_encoding="utf-8",
        extra="ignore"  # Safely ignore any extra variables present in the .env file
    )

# Global settings instance, loaded on application startup
try:
    settings = Settings()
except ValidationError as e:
    print(
        "Critical Error: Failed to validate application configuration.\n"
        "Please ensure all required environment variables are set in your environment or '.env' file.\n"
        f"Validation Details:\n{e}",
        file=sys.stderr
    )
    sys.exit(1)
