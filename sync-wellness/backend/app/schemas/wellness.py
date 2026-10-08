from pydantic import BaseModel, Field, model_validator
from typing import Optional, List, Dict, Any, Union
from datetime import date, datetime
from enum import Enum


# ─── Cycles ──────────────────────────────────────────────────────────────────

class CyclePhase(str, Enum):
    MENSTRUAL = "menstrual"
    FOLLICULAR = "follicular"
    OVULATION = "ovulation"
    LUTEAL = "luteal"


class CycleCreate(BaseModel):
    period_start: Optional[date] = None
    period_start_date: Optional[date] = None
    period_end: Optional[date] = None
    period_end_date: Optional[date] = None
    cycle_length: int = Field(28, ge=15, le=60)
    period_length: int = Field(5, ge=1, le=15)
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def check_period_start(cls, values: Any) -> Any:
        if isinstance(values, dict):
            start = values.get("period_start") or values.get("period_start_date")
            if not start:
                raise ValueError("period_start or period_start_date is required")
            values["period_start"] = start
            if "period_end_date" in values and "period_end" not in values:
                values["period_end"] = values["period_end_date"]
        return values


class CycleUpdate(BaseModel):
    period_start: Optional[date] = None
    period_start_date: Optional[date] = None
    period_end: Optional[date] = None
    period_end_date: Optional[date] = None
    cycle_length: Optional[int] = Field(None, ge=15, le=60)
    period_length: Optional[int] = Field(None, ge=1, le=15)
    notes: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def check_aliases(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if "period_start_date" in values and not values.get("period_start"):
                values["period_start"] = values["period_start_date"]
            if "period_end_date" in values and not values.get("period_end"):
                values["period_end"] = values["period_end_date"]
        return values


class CycleResponse(BaseModel):
    id: int
    user_id: int
    period_start: date
    period_end: Optional[date] = None
    cycle_length: int
    period_length: int
    predicted_next_cycle: Optional[date] = None
    current_phase: Optional[str] = None
    ovulation_date: Optional[date] = None
    fertile_window_start: Optional[date] = None
    fertile_window_end: Optional[date] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CyclePredictionResponse(BaseModel):
    predicted_next_period: Optional[date] = None
    predicted_cycle_length: int = 28
    confidence: str = "moderate"  # ml | high | moderate | baseline
    method: str = "ml"  # ml | historical_average | default_baseline
    ovulation_date: Optional[date] = None
    fertile_window_start: Optional[date] = None
    fertile_window_end: Optional[date] = None
    current_phase: Optional[str] = None
    cycle_day: Optional[int] = None
    days_until_next_period: Optional[int] = None
    disclaimer: str = (
        "Cycle predictions are estimates based on your logged patterns. "
        "They are not medical diagnoses or guarantees of fertility."
    )


class CycleStatsResponse(BaseModel):
    total_cycles: int
    average_cycle_length: Optional[float] = None
    average_period_length: Optional[float] = None
    shortest_cycle: Optional[int] = None
    longest_cycle: Optional[int] = None
    cycle_variability: Optional[float] = None  # Standard deviation
    is_regular: bool = True
    observation: str = ""


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
    mood: str
    mood_score: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    anxiety_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    notes: Optional[str] = None
    journal: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def sync_notes_journal(cls, values: Any) -> Any:
        if isinstance(values, dict):
            if values.get("notes") and not values.get("journal"):
                values["journal"] = values["notes"]
            elif values.get("journal") and not values.get("notes"):
                values["notes"] = values["journal"]
        return values


class MoodUpdate(BaseModel):
    mood: Optional[str] = None
    mood_score: Optional[int] = Field(None, ge=1, le=10)
    stress_level: Optional[int] = Field(None, ge=1, le=10)
    anxiety_level: Optional[int] = Field(None, ge=1, le=10)
    energy_level: Optional[int] = Field(None, ge=1, le=10)
    sleep_hours: Optional[float] = Field(None, ge=0, le=24)
    notes: Optional[str] = None
    journal: Optional[str] = None


class MoodResponse(BaseModel):
    id: int
    user_id: int
    date: date
    mood: str
    mood_score: Optional[int] = None
    stress_level: Optional[int] = None
    anxiety_level: Optional[int] = None
    energy_level: Optional[int] = None
    sleep_hours: Optional[float] = None
    notes: Optional[str] = None
    journal: Optional[str] = None
    sentiment_score: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MoodSummaryResponse(BaseModel):
    has_data: bool
    total_entries: int = 0
    average_mood_score: Optional[float] = None
    average_stress: Optional[float] = None
    average_anxiety: Optional[float] = None
    average_energy: Optional[float] = None
    average_sleep: Optional[float] = None
    dominant_mood: Optional[str] = None
    mood_distribution: Dict[str, int] = {}
    mood_trend: List[Dict[str, Any]] = []
    patterns: List[str] = []
    recent_entries: List[MoodResponse] = []


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
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

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
    water_intake: Optional[float] = None
    iron_level: Optional[float] = None
    hemoglobin: Optional[float] = None
    diet_plan: Optional[str] = None
    meals: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

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
    description: Optional[str] = None
    scheduled_time: datetime
    repeat: str
    completed: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, obj: Any) -> "ReminderResponse":
        obj.completed = bool(obj.completed)
        return super().from_orm(obj)


# ─── Chat ─────────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    message: Optional[str] = None
    question: Optional[str] = None
    conversation_id: Optional[int] = None

    @model_validator(mode="before")
    @classmethod
    def validate_message_or_question(cls, values: Any) -> Any:
        if isinstance(values, dict):
            text = values.get("message") or values.get("question")
            if not text or not str(text).strip():
                raise ValueError("Message content cannot be empty")
            values["message"] = str(text).strip()
            values["question"] = str(text).strip()
        return values


class ChatResponse(BaseModel):
    id: Optional[int] = None
    question: Optional[str] = None
    message: Optional[str] = None
    response: str
    answer: Optional[str] = None
    conversation_id: Optional[int] = None
    sources: Optional[List[str]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    sources: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    messages: Optional[List[ChatMessageResponse]] = None

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
    created_at: Optional[datetime] = None

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
    file_url: Optional[str] = None
    generated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
