import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    presentations = relationship("Presentation", back_populates="owner", cascade="all, delete-orphan")
    rehearsals = relationship("RehearsalSession", back_populates="user")


class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), default="General")
    theme = Column(String(50), default="dark")
    file_path = Column(String(512), nullable=True)
    file_type = Column(String(50), default="scratch")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    owner = relationship("User", back_populates="presentations")
    slides = relationship("Slide", back_populates="presentation", cascade="all, delete-orphan", order_by="Slide.slide_number")
    rehearsals = relationship("RehearsalSession", back_populates="presentation", cascade="all, delete-orphan")


class Slide(Base):
    __tablename__ = "slides"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    presentation_id = Column(String(36), ForeignKey("presentations.id"), nullable=False, index=True)
    slide_number = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    subtitle = Column(String(255), nullable=True)
    elements_json = Column(Text, default="[]")
    speaker_notes = Column(Text, default="")
    estimated_duration_seconds = Column(Integer, default=60)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    presentation = relationship("Presentation", back_populates="slides")


class RehearsalSession(Base):
    __tablename__ = "rehearsal_sessions"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    presentation_id = Column(String(36), ForeignKey("presentations.id"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    total_duration_seconds = Column(Integer, default=0)
    avg_pace_wpm = Column(Float, default=130.0)
    gestures_used = Column(Integer, default=0)
    accuracy_rate = Column(Float, default=0.98)
    slide_breakdown_json = Column(Text, default="{}")
    ai_feedback_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    presentation = relationship("Presentation", back_populates="rehearsals")
    user = relationship("User", back_populates="rehearsals")
