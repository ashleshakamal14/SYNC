from fastapi import FastAPI

from app.database.connection import Base, engine
from app.models.user import User
from app.routes.auth import router as auth_router


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="SYNC API",
    description="AI Powered Women's Wellness Companion",
    version="1.0.0"
)


# Register authentication routes
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to SYNC API",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "connected"
    }