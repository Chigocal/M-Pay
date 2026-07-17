from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base, Session

try:
    from backend.app.config import settings
except ImportError:
    from app.config import settings

# Determine if the database is SQLite to apply connection arguments
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

connect_args = {}
if is_sqlite:
    connect_args["check_same_thread"] = False

# Create the engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args
)

# Create the SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Create the declarative mapping base
Base = declarative_base()

# Dependency generator function to yield database sessions
def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that provides a thread-safe database session.
    Ensures that the session is strictly closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
