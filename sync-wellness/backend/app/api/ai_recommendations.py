"""
AI Recommendations API endpoint.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import date, timedelta
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Cycle, MoodLog, Symptom, Nutrition
from app.ai.recommendation_engine import generate_recommendations
from app.ai.cycle_engine import calculate_cycle_metrics

router = APIRouter(prefix="/api/ai", tags=["AI Recommendations"])


@router.get("/recommendations", response_model=dict)
def get_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()

    # Get latest cycle phase
    latest_cycle = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.desc())
        .first()
    )
    phase = None
    if latest_cycle:
        metrics = calculate_cycle_metrics(latest_cycle.period_start, latest_cycle.cycle_length, latest_cycle.period_length)
        phase = metrics.get("current_phase")

    # Get today's mood
    today_mood = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id, MoodLog.date == today)
        .first()
    )

    # Get recent symptoms (last 3 days)
    recent_symptoms = (
        db.query(Symptom)
        .filter(
            Symptom.user_id == current_user.id,
            Symptom.date >= today - timedelta(days=3),
        )
        .all()
    )
    symptom_types = [s.symptom_type for s in recent_symptoms]

    # Get today's nutrition
    today_nutrition = (
        db.query(Nutrition)
        .filter(Nutrition.user_id == current_user.id, Nutrition.date == today)
        .first()
    )

    result = generate_recommendations(
        phase=phase,
        mood=today_mood.mood if today_mood else None,
        symptoms=symptom_types,
        water_intake=today_nutrition.water_intake if today_nutrition else None,
        energy_level=today_mood.energy_level if today_mood else None,
        stress_level=today_mood.stress_level if today_mood else None,
    )
    return result
