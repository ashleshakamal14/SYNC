"""
Analytics API - aggregated data for charts and dashboards.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict
from datetime import date, timedelta
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Cycle, MoodLog, Symptom, Nutrition, Reminder

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard", response_model=dict)
def get_dashboard_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    thirty_days_ago = today - timedelta(days=30)
    seven_days_ago = today - timedelta(days=7)

    # Latest cycle
    latest_cycle = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.desc())
        .first()
    )

    # Recent mood logs (last 7 days for mini chart)
    recent_moods = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id, MoodLog.date >= seven_days_ago)
        .order_by(MoodLog.date.asc())
        .all()
    )

    # Recent symptoms (last 30 days)
    recent_symptoms = (
        db.query(Symptom)
        .filter(Symptom.user_id == current_user.id, Symptom.date >= thirty_days_ago)
        .all()
    )

    # Today's water intake
    today_nutrition = (
        db.query(Nutrition)
        .filter(Nutrition.user_id == current_user.id, Nutrition.date == today)
        .first()
    )

    # Upcoming reminders
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    upcoming = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.scheduled_time >= now,
            Reminder.completed == 0,
        )
        .order_by(Reminder.scheduled_time.asc())
        .limit(5)
        .all()
    )

    # Build mood chart data
    mood_chart = [
        {
            "date": str(m.date),
            "mood": m.mood,
            "stress": m.stress_level,
            "energy": m.energy_level,
            "sentiment": m.sentiment_score,
        }
        for m in recent_moods
    ]

    # Symptom frequency
    sym_freq: Dict[str, int] = {}
    for s in recent_symptoms:
        sym_freq[s.symptom_type] = sym_freq.get(s.symptom_type, 0) + 1

    return {
        "has_cycle_data": latest_cycle is not None,
        "latest_cycle": {
            "period_start": str(latest_cycle.period_start) if latest_cycle else None,
            "current_phase": latest_cycle.current_phase if latest_cycle else None,
            "predicted_next_cycle": str(latest_cycle.predicted_next_cycle) if latest_cycle and latest_cycle.predicted_next_cycle else None,
            "cycle_length": latest_cycle.cycle_length if latest_cycle else None,
            "days_until_next": (latest_cycle.predicted_next_cycle - today).days if latest_cycle and latest_cycle.predicted_next_cycle else None,
        },
        "mood_chart": mood_chart,
        "symptom_frequency": sym_freq,
        "water_today": today_nutrition.water_intake if today_nutrition else None,
        "upcoming_reminders": [
            {
                "id": r.id,
                "title": r.title,
                "type": r.type,
                "scheduled_time": r.scheduled_time.isoformat(),
            }
            for r in upcoming
        ],
    }


@router.get("/cycles/history", response_model=dict)
def get_cycle_history_chart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cycles = (
        db.query(Cycle)
        .filter(Cycle.user_id == current_user.id)
        .order_by(Cycle.period_start.asc())
        .limit(12)
        .all()
    )
    return {
        "data": [
            {
                "start": str(c.period_start),
                "cycle_length": c.cycle_length,
                "period_length": c.period_length,
                "phase": c.current_phase,
            }
            for c in cycles
        ]
    }


@router.get("/moods/trends", response_model=dict)
def get_mood_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    logs = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id, MoodLog.date >= since)
        .order_by(MoodLog.date.asc())
        .all()
    )

    mood_counts: Dict[str, int] = {}
    for l in logs:
        mood_counts[l.mood] = mood_counts.get(l.mood, 0) + 1

    return {
        "timeline": [
            {
                "date": str(l.date),
                "mood": l.mood,
                "stress": l.stress_level,
                "energy": l.energy_level,
                "sentiment": l.sentiment_score,
            }
            for l in logs
        ],
        "distribution": mood_counts,
    }


@router.get("/symptoms/trends", response_model=dict)
def get_symptom_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    since = date.today() - timedelta(days=days)
    symptoms = (
        db.query(Symptom)
        .filter(Symptom.user_id == current_user.id, Symptom.date >= since)
        .order_by(Symptom.date.asc())
        .all()
    )

    by_type: Dict[str, List] = {}
    for s in symptoms:
        by_type.setdefault(s.symptom_type, []).append(
            {"date": str(s.date), "severity": s.severity}
        )

    return {
        "by_type": by_type,
        "total": len(symptoms),
    }
