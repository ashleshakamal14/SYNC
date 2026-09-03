from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


# ─── Cycles ──────────────────────────────────────────────────────────────────

class CyclePhase(str, Enum):
    MENSTRUAL = "menstrual"
    FOLLICULAR = "follicular"
    OVULATION = "ovulation"
    LUTEAL = "luteal"


class CycleCreate(BaseModel):
    period_start: date
    period_end: Optional[date] = None
    cycle_length: int = Field(28, ge=15, le=60)
    period_length: int = Field(5, ge=1, le=15)
    notes: Optional[str] = None


class CycleUpdate(BaseModel):
    period_end: Optional[date] = None
    cycle_length: Optional[int] = Field(None, ge=15, le=60)
    period_length: Optional[int] = Field(None, ge=1, le=15)
    notes: Optional[str] = None


class CycleResponse(BaseModel):
    id: int
    user_id: int
    period_start: date
    period_end: Optional[date]
    cycle_length: int
    period_length: int
    predicted_next_cycle: Optional[date]
    current_phase: Optional[str]
    ovulation_date: Optional[date]
    fertile_window_start: Optional[date]
    fertile_window_end: Optional[date]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Mood ─────────────────────────────────────────────────────────────────────

class MoodType(str, Enum):
    HAPPY = "happy"
    CALM = "calm"
    NEUTRAL = "neutral"
    SAD = "sad"
    ANXIOUS = "anxious"
    IRRITATED = "irritated"
    TIRED = "tired"
    ENERGETIC = "energetic"


class MoodCreate(BaseModel):
    date: date
    mood: MoodType
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    journal: Optional[str] = None


class MoodUpdate(BaseModel):
    mood: Optional[MoodType] = None
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    journal: Optional[str] = None


class MoodResponse(BaseModel):
    id: int
    user_id: int
    date: date
    mood: str
    stress_level: Optional[int]
    energy_level: Optional[int]
    journal: Optional[str]
    sentiment_score: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Symptoms ─────────────────────────────────────────────────────────────────

class SymptomType(str, Enum):
    CRAMPS = "cramps"
    HEADACHE = "headache"
    ACNE = "acne"
    FATIGUE = "fatigue"
    BLOATING = "bloating"
    BACK_PAIN = "back_pain"
    BREAST_TENDERNESS = "breast_tenderness"
    NAUSEA = "nausea"
    MOOD_SWINGS = "mood_swings"
    INSOMNIA = "insomnia"
    OTHER = "other"


class SymptomCreate(BaseModel):
    date: date
    symptom_type: SymptomType
    severity: int = Field(..., ge=1, le=5)
    notes: Optional[str] = None


class SymptomUpdate(BaseModel):
    severity: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None


class SymptomResponse(BaseModel):
    id: int
    user_id: int
    date: date
    symptom_type: str
    severity: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Nutrition ────────────────────────────────────────────────────────────────

class NutritionCreate(BaseModel):
    date: date
    water_intake: Optional[float] = Field(None, ge=0, le=20)  # liters
    iron_level: Optional[float] = Field(None, ge=0)
    hemoglobin: Optional[float] = Field(None, ge=0)
    diet_plan: Optional[str] = None
    meals: Optional[str] = None  # JSON string
    notes: Optional[str] = None


class NutritionUpdate(BaseModel):
    water_intake: Optional[float] = Field(None, ge=0, le=20)
    iron_level: Optional[float] = None
    hemoglobin: Optional[float] = None
    diet_plan: Optional[str] = None
    meals: Optional[str] = None
    notes: Optional[str] = None


class NutritionResponse(BaseModel):
    id: int
    user_id: int
    date: date
    water_intake: Optional[float]
    iron_level: Optional[float]
    hemoglobin: Optional[float]
    diet_plan: Optional[str]
    meals: Optional[str]
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Reminders ────────────────────────────────────────────────────────────────

class ReminderType(str, Enum):
    MEDICINE = "medicine"
    WATER = "water"
    PERIOD = "period"
    APPOINTMENT = "appointment"
    CUSTOM = "custom"


class ReminderCreate(BaseModel):
    type: ReminderType
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    scheduled_time: datetime
    repeat: str = "none"  # none|daily|weekly|monthly


class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    repeat: Optional[str] = None
    completed: Optional[bool] = None


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    description: Optional[str]
    scheduled_time: datetime
    repeat: str
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj):
        obj.completed = bool(obj.completed)
        return super().from_orm(obj)


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=2000)


class ChatResponse(BaseModel):
    id: int
    question: str
    answer: str
    sources: Optional[List[str]]
    timestamp: datetime

    class Config:
        from_attributes = True


# ─── Partner ──────────────────────────────────────────────────────────────────

class PartnerInvite(BaseModel):
    partner_email: str
    permission_cycle: bool = False
    permission_mood: bool = False
    permission_profile: bool = False


class PartnerUpdate(BaseModel):
    permission_cycle: Optional[bool] = None
    permission_mood: Optional[bool] = None
    permission_profile: Optional[bool] = None


class PartnerResponse(BaseModel):
    id: int
    user_id: int
    partner_email: str
    permission_cycle: bool
    permission_mood: bool
    permission_profile: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Reports ──────────────────────────────────────────────────────────────────

class ReportCreate(BaseModel):
    report_type: str  # cycle|mood|symptom|wellness|monthly
    title: str


class ReportResponse(BaseModel):
    id: int
    user_id: int
    report_type: str
    title: str
    file_url: Optional[str]
    generated_at: datetime

    class Config:
        from_attributes = True
