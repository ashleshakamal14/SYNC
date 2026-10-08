from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import MoodLog
from app.schemas.wellness import (
    MoodCreate,
    MoodUpdate,
    MoodResponse,
    MoodSummaryResponse,
)
from app.ai.mood_engine import (
    analyze_sentiment,
    mood_summary,
    MOOD_SCORE_BASE,
)

router = APIRouter(prefix="/api/moods", tags=["Mood Tracking"])


# ============================================================
# CREATE MOOD ENTRY
# ============================================================

@router.post(
    "",
    response_model=MoodResponse,
    status_code=status.HTTP_201_CREATED,
)
@router.post(
    "/",
    response_model=MoodResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_mood(
    mood_in: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new mood / wellness log entry.
    """
    # Calculate mood score if not provided
    score = mood_in.mood_score
    if score is None:
        score = MOOD_SCORE_BASE.get(mood_in.mood.lower(), 5)

    sentiment = analyze_sentiment(mood_in.journal or mood_in.notes, mood_in.mood)

    log = MoodLog(
        user_id=current_user.id,
        date=mood_in.date,
        mood=mood_in.mood,
        mood_score=score,
        stress_level=mood_in.stress_level,
        anxiety_level=mood_in.anxiety_level,
        energy_level=mood_in.energy_level,
        sleep_hours=mood_in.sleep_hours,
        notes=mood_in.notes or mood_in.journal,
        journal=mood_in.journal or mood_in.notes,
        sentiment_score=sentiment,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return MoodResponse.model_validate(log)


# ============================================================
# GET MOOD ENTRIES (WITH DATE FILTERS & USER ISOLATION)
# ============================================================

@router.get(
    "",
    response_model=List[MoodResponse],
)
@router.get(
    "/",
    response_model=List[MoodResponse],
)
def get_moods(
    days: Optional[int] = Query(None, ge=1, le=365, description="Filter to past N days (e.g. 7 or 30)"),
    start_date: Optional[date] = Query(None, description="Custom start date"),
    end_date: Optional[date] = Query(None, description="Custom end date"),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get mood entries for the authenticated user, optionally filtered by date range or past N days.
    """
    query = db.query(MoodLog).filter(MoodLog.user_id == current_user.id)

    if days is not None:
        cutoff = date.today() - timedelta(days=days)
        query = query.filter(MoodLog.date >= cutoff)
    else:
        if start_date:
            query = query.filter(MoodLog.date >= start_date)
        if end_date:
            query = query.filter(MoodLog.date <= end_date)

    logs = query.order_by(MoodLog.date.desc()).offset(skip).limit(limit).all()
    return [MoodResponse.model_validate(l) for l in logs]


# ============================================================
# GET MOOD SUMMARY & TRENDS (PHASE 4)
# ============================================================

@router.get(
    "/summary",
    response_model=MoodSummaryResponse,
)
def get_mood_summary(
    days: Optional[int] = Query(None, ge=1, le=365, description="Filter summary to past N days (e.g. 7 or 30)"),
    start_date: Optional[date] = Query(None, description="Custom start date"),
    end_date: Optional[date] = Query(None, description="Custom end date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate comprehensive mood summary:
    average mood score, stress, anxiety, energy, sleep, mood trend, and recent entries.
    """
    query = db.query(MoodLog).filter(MoodLog.user_id == current_user.id)

    if days is not None:
        cutoff = date.today() - timedelta(days=days)
        query = query.filter(MoodLog.date >= cutoff)
    else:
        if start_date:
            query = query.filter(MoodLog.date >= start_date)
        if end_date:
            query = query.filter(MoodLog.date <= end_date)

    logs = query.order_by(MoodLog.date.asc()).all()

    if not logs:
        return MoodSummaryResponse(
            has_data=False,
            total_entries=0,
            recent_entries=[],
        )

    logs_dicts = [
        {
            "id": l.id,
            "date": l.date,
            "mood": l.mood,
            "mood_score": l.mood_score or MOOD_SCORE_BASE.get(l.mood.lower(), 5),
            "stress_level": l.stress_level,
            "anxiety_level": l.anxiety_level,
            "energy_level": l.energy_level,
            "sleep_hours": l.sleep_hours,
            "sentiment_score": l.sentiment_score,
            "notes": l.notes or l.journal,
        }
        for l in logs
    ]

    summary = mood_summary(logs_dicts)
    summary["recent_entries"] = [
        MoodResponse.model_validate(l) for l in reversed(logs[-10:])
    ]

    return MoodSummaryResponse(**summary)


# ============================================================
# GET SINGLE MOOD ENTRY
# ============================================================

@router.get(
    "/{mood_id}",
    response_model=MoodResponse,
)
def get_mood(
    mood_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific mood entry by ID. Enforces user isolation.
    """
    log = (
        db.query(MoodLog)
        .filter(
            MoodLog.id == mood_id,
            MoodLog.user_id == current_user.id,
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood entry not found",
        )

    return MoodResponse.model_validate(log)


# ============================================================
# UPDATE MOOD ENTRY
# ============================================================

@router.put(
    "/{mood_id}",
    response_model=MoodResponse,
)
def update_mood(
    mood_id: int,
    update: MoodUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an existing mood entry.
    """
    log = (
        db.query(MoodLog)
        .filter(
            MoodLog.id == mood_id,
            MoodLog.user_id == current_user.id,
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood entry not found",
        )

    update_dict = update.model_dump(exclude_none=True)
    for field, value in update_dict.items():
        setattr(log, field, value)

    # Sync journal/notes
    if update.notes and not update.journal:
        log.journal = update.notes
    elif update.journal and not update.notes:
        log.notes = update.journal

    if update.mood or update.journal or update.notes:
        log.sentiment_score = analyze_sentiment(log.journal or log.notes, log.mood)

    db.commit()
    db.refresh(log)

    return MoodResponse.model_validate(log)


# ============================================================
# DELETE MOOD ENTRY
# ============================================================

@router.delete(
    "/{mood_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_mood(
    mood_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a mood entry. Enforces user isolation.
    """
    log = (
        db.query(MoodLog)
        .filter(
            MoodLog.id == mood_id,
            MoodLog.user_id == current_user.id,
        )
        .first()
    )

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mood entry not found",
        )

    db.delete(log)
    db.commit()

    return None
