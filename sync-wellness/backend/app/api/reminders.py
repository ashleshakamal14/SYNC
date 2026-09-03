from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List
from datetime import datetime, timezone
from app.core.security import get_current_user
from app.database.session import get_db
from app.models.user import User
from app.models.wellness import Reminder
from app.schemas.wellness import ReminderCreate, ReminderUpdate, ReminderResponse

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])


@router.post("", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ReminderResponse, status_code=status.HTTP_201_CREATED)
def create_reminder(
    r_in: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminder = Reminder(
        user_id=current_user.id,
        type=r_in.type,
        title=r_in.title,
        description=r_in.description,
        scheduled_time=r_in.scheduled_time,
        repeat=r_in.repeat,
    )
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    reminder.completed = bool(reminder.completed)
    return ReminderResponse.model_validate(reminder)


@router.get("", response_model=List[ReminderResponse])
@router.get("/", response_model=List[ReminderResponse])
def get_reminders(

    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    reminders = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id)
        .order_by(Reminder.scheduled_time.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    for r in reminders:
        r.completed = bool(r.completed)
    return [ReminderResponse.model_validate(r) for r in reminders]


@router.get("/upcoming", response_model=List[ReminderResponse])
def get_upcoming_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == current_user.id,
            Reminder.scheduled_time >= now,
            Reminder.completed == 0,
        )
        .order_by(Reminder.scheduled_time.asc())
        .limit(10)
        .all()
    )
    for r in reminders:
        r.completed = bool(r.completed)
    return [ReminderResponse.model_validate(r) for r in reminders]


@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    update: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")

    data = update.model_dump(exclude_none=True)
    if "completed" in data:
        data["completed"] = int(data["completed"])
    for field, value in data.items():
        setattr(r, field, value)

    db.commit()
    db.refresh(r)
    r.completed = bool(r.completed)
    return ReminderResponse.model_validate(r)


@router.post("/{reminder_id}/complete", response_model=ReminderResponse)
def complete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    r.completed = 1
    db.commit()
    db.refresh(r)
    r.completed = True
    return ReminderResponse.model_validate(r)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    r = db.query(Reminder).filter(
        Reminder.id == reminder_id, Reminder.user_id == current_user.id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reminder not found")
    db.delete(r)
    db.commit()
