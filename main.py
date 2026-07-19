from fastapi import FastAPI
import uvicorn

from backend.app.database import engine, Base
from backend.app.config import settings
from backend.app import models
from backend.routers import auth
from backend.routers import conversions

# Automatically generate database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Airtime-to-Cash API",
    version="1.0.0"
)

print("DEVELOPER INFO - ACTIVE AGGREGATOR_API_KEY:", settings.AGGREGATOR_API_KEY)

app.include_router(auth.router)
app.include_router(conversions.router)

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
    # Triggering reload
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
