from fastapi import FastAPI
import uvicorn

from backend.app.database import engine, Base
from backend.app.config import settings
from backend.app import models
from backend.routers import auth

# Automatically generate database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Airtime-to-Cash API",
    version="1.0.0"
)

app.include_router(auth.router)

@app.get("/", tags=["Health"])
def health_check():
    """
    Root endpoint serving as a basic API health status indicator.
    """
    return {
        "status": "active",
        "message": "Airtime-to-Cash backend is running perfectly!"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
