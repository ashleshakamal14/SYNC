from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer, nullable=True)
    height = Column(Float, nullable=True)   # cm
    weight = Column(Float, nullable=True)   # kg
    medical_conditions = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    timezone = Column(String(100), default="UTC")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    cycles = relationship("Cycle", back_populates="user", cascade="all, delete-orphan")
    mood_logs = relationship("MoodLog", back_populates="user", cascade="all, delete-orphan")
    symptoms = relationship("Symptom", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("Nutrition", back_populates="user", cascade="all, delete-orphan")
    partners = relationship("Partner", back_populates="user", cascade="all, delete-orphan",
                            foreign_keys="Partner.user_id")
    reminders = relationship("Reminder", back_populates="user", cascade="all, delete-orphan")
    chat_history = relationship("ChatHistory", back_populates="user", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
