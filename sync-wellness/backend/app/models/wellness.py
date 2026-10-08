from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class Cycle(Base):
    __tablename__ = "cycles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=True)
    cycle_length = Column(Integer, default=28)    # days
    period_length = Column(Integer, default=5)    # days
    predicted_next_cycle = Column(Date, nullable=True)
    current_phase = Column(String(50), nullable=True)  # menstrual|follicular|ovulation|luteal
    ovulation_date = Column(Date, nullable=True)
    fertile_window_start = Column(Date, nullable=True)
    fertile_window_end = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="cycles")


class MoodLog(Base):
    __tablename__ = "mood_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    mood = Column(String(50), nullable=False)         # happy|calm|neutral|sad|anxious|irritated|tired|energetic
    mood_score = Column(Integer, nullable=True)       # 1-10
    stress_level = Column(Integer, nullable=True)     # 1-10
    anxiety_level = Column(Integer, nullable=True)    # 1-10
    energy_level = Column(Integer, nullable=True)     # 1-10
    sleep_hours = Column(Float, nullable=True)        # hours of sleep (e.g. 7.5)
    notes = Column(Text, nullable=True)
    journal = Column(Text, nullable=True)
    sentiment_score = Column(Float, nullable=True)    # -1 to 1
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="mood_logs")


# Model alias for convenience
MoodEntry = MoodLog


class Symptom(Base):
    __tablename__ = "symptoms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    symptom_type = Column(String(100), nullable=False)  # cramps|headache|acne|fatigue|bloating|etc
    severity = Column(Integer, nullable=False)          # 1-5
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="symptoms")


class Nutrition(Base):
    __tablename__ = "nutrition"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    water_intake = Column(Float, nullable=True)     # liters
    iron_level = Column(Float, nullable=True)       # mg/dL (user-reported)
    hemoglobin = Column(Float, nullable=True)       # g/dL (user-reported)
    diet_plan = Column(String(100), nullable=True)  # vegetarian|vegan|omnivore|etc
    meals = Column(Text, nullable=True)             # JSON string
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="nutrition_logs")


class Partner(Base):
    __tablename__ = "partners"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    partner_email = Column(String(255), nullable=False)
    partner_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    permission_cycle = Column(Integer, default=False)   # bool as int for compatibility
    permission_mood = Column(Integer, default=False)
    permission_profile = Column(Integer, default=False)
    invite_token = Column(String(255), nullable=True)
    status = Column(String(50), default="pending")  # pending|accepted|revoked
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="partners", foreign_keys=[user_id])


class Reminder(Base):
    __tablename__ = "reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(50), nullable=False)  # medicine|water|period|appointment|custom
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    repeat = Column(String(50), default="none")  # none|daily|weekly|monthly
    completed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reminders")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="conversations")
    messages = relationship("ChatMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="ChatMessage.created_at")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)      # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")


class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    sources = Column(Text, nullable=True)   # JSON string of sources
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="chat_history")


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type = Column(String(100), nullable=False)  # cycle|mood|symptom|wellness|monthly
    title = Column(String(255), nullable=False)
    file_url = Column(String(1000), nullable=True)
    file_path = Column(String(1000), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reports")
