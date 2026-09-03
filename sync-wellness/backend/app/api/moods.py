from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import MoodLog
from app.schemas.wellness import MoodCreate, MoodUpdate, MoodResponse
from app.ai.mood_engine import analyze_sentiment, mood_summary

router = APIRouter(prefix="/api/moods", tags=["Mood Tracking"])


@router.post("", response_model=MoodResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=MoodResponse, status_code=status.HTTP_201_CREATED)
def create_mood(
    mood_in: MoodCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sentiment = analyze_sentiment(mood_in.journal, mood_in.mood)
    log = MoodLog(
        user_id=current_user.id,
        date=mood_in.date,
        mood=mood_in.mood,
        stress_level=mood_in.stress_level,
        energy_level=mood_in.energy_level,
        journal=mood_in.journal,
        sentiment_score=sentiment,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return MoodResponse.model_validate(log)


@router.get("", response_model=List[MoodResponse])
@router.get("/", response_model=List[MoodResponse])
def get_moods(

    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = (
        db.query(MoodLog)
        .filter(MoodLog.user_id == current_user.id)
        .order_by(MoodLog.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [MoodResponse.model_validate(l) for l in logs]


@router.get("/summary", response_model=dict)
def get_mood_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    logs = db.query(MoodLog).filter(MoodLog.user_id == current_user.id).order_by(MoodLog.date).all()
    if not logs:
        return {"has_data": False}

    logs_dicts = [
        {
            "mood": l.mood,
            "stress_level": l.stress_level,
            "energy_level": l.energy_level,
            "sentiment_score": l.sentiment_score,
        }
        for l in logs
    ]
    summary = mood_summary(logs_dicts)
    summary["has_data"] = True
    return summary


@router.get("/{mood_id}", response_model=MoodResponse)
def get_mood(
    mood_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(MoodLog).filter(MoodLog.id == mood_id, MoodLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Mood log not found")
    return MoodResponse.model_validate(log)


@router.put("/{mood_id}", response_model=MoodResponse)
def update_mood(
    mood_id: int,
    update: MoodUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(MoodLog).filter(MoodLog.id == mood_id, MoodLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Mood log not found")

    for field, value in update.model_dump(exclude_none=True).items():
        setattr(log, field, value)

    if update.mood or update.journal:
        log.sentiment_score = analyze_sentiment(log.journal, log.mood)

    db.commit()
    db.refresh(log)
    return MoodResponse.model_validate(log)


@router.delete("/{mood_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_mood(
    mood_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    log = db.query(MoodLog).filter(MoodLog.id == mood_id, MoodLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Mood log not found")
    db.delete(log)
    db.commit()
