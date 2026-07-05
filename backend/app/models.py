import enum
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime,
    ForeignKey, Enum, Text, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    user = "user"
    skincare_consultant = "skincare_consultant"
    dermatologist = "dermatologist"
    administrator = "administrator"


class SkinTypeEnum(str, enum.Enum):
    oily = "oily"
    dry = "dry"
    combination = "combination"
    normal = "normal"
    sensitive = "sensitive"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.user)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lifestyle_entries = relationship("LifestyleEntry", back_populates="user", cascade="all, delete-orphan")
    progress_entries = relationship("ProgressEntry", back_populates="user", cascade="all, delete-orphan")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    age = Column(Integer, nullable=True)
    gender = Column(String(30), nullable=True)
    skin_type = Column(Enum(SkinTypeEnum), nullable=True)
    skin_concerns = Column(Text, nullable=True)       # comma-separated or JSON string
    allergies = Column(Text, nullable=True)           # comma-separated or JSON string
    skin_sensitivities = Column(Text, nullable=True)  # comma-separated or JSON string

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="skin_profile")


class LifestyleEntry(Base):
    __tablename__ = "lifestyle_entries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    entry_date = Column(Date, default=date.today, nullable=False)
    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    exercise_minutes = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)   # 1 (low) - 5 (high)
    environmental_exposure = Column(String(255), nullable=True)  # e.g. "high pollution, sun exposure"

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="lifestyle_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_user_lifestyle_date"),
    )


class ProgressEntry(Base):
    """Tracks skin progress over time (photos/notes/metrics) - populated more heavily in later milestones."""
    __tablename__ = "progress_entries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    entry_date = Column(Date, default=date.today, nullable=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    hydration_score = Column(Integer, nullable=True)
    breakout_count = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_entries")
