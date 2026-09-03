from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8)
    age: Optional[int] = Field(None, ge=10, le=120)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    age: Optional[int] = Field(None, ge=10, le=120)
    height: Optional[float] = Field(None, ge=50, le=300)
    weight: Optional[float] = Field(None, ge=20, le=500)
    medical_conditions: Optional[str] = None
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    age: Optional[int]
    height: Optional[float]
    weight: Optional[float]
    medical_conditions: Optional[str]
    avatar_url: Optional[str]
    timezone: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
