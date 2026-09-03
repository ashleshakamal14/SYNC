from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time

from app.core.config import settings
from app.database.session import Base, engine

# Import all models to ensure they're registered with SQLAlchemy
from app.models import User, Cycle, MoodLog, Symptom, Nutrition, Partner, Reminder, ChatHistory, Report  # noqa

# API Routers
from app.api import auth, cycles, moods, symptoms, nutrition, reminders, chat, partners, analytics, ai_recommendations, reports

# Create tables (use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SYNC Wellness API",
    description="AI-Powered Women's Wellness Companion — Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"detail": "An internal error occurred. Please try again."},
        )
    response.headers["X-Process-Time"] = str(round(time.time() - start_time, 4))
    return response


# Include routers
app.include_router(auth.router)
app.include_router(cycles.router)
app.include_router(moods.router)
app.include_router(symptoms.router)
app.include_router(nutrition.router)
app.include_router(reminders.router)
app.include_router(chat.router)
app.include_router(partners.router)
app.include_router(analytics.router)
app.include_router(ai_recommendations.router)
app.include_router(reports.router)


@app.get("/", tags=["Health"])
def root():
    return {
        "app": "SYNC Wellness API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/api/docs",
        "disclaimer": (
            "SYNC provides general wellness information and is not a substitute "
            "for professional medical advice."
        ),
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
