from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

from app.models import RoleEnum, SkinTypeEnum


# ---------- Auth ----------
class UserRegister(BaseModel):
    full_name: str = Field(..., max_length=150)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: RoleEnum = RoleEnum.user


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Skin Profile ----------
class SkinProfileIn(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    skin_type: Optional[SkinTypeEnum] = None
    skin_concerns: Optional[str] = None
    allergies: Optional[str] = None
    skin_sensitivities: Optional[str] = None


class SkinProfileOut(SkinProfileIn):
    id: str
    user_id: str
    updated_at: datetime

    class Config:
        from_attributes = True


# ---------- Lifestyle ----------
class LifestyleEntryIn(BaseModel):
    entry_date: date
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    exercise_minutes: Optional[int] = None
    stress_level: Optional[int] = Field(None, ge=1, le=5)
    environmental_exposure: Optional[str] = None


class LifestyleEntryOut(LifestyleEntryIn):
    id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True
