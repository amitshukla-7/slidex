from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    type: Optional[str] = None


# Slide Schemas
class SlideElementSchema(BaseModel):
    id: str
    type: str
    content: Any


class SlideBase(BaseModel):
    slide_number: int
    title: str
    subtitle: Optional[str] = None
    elements: List[SlideElementSchema] = []
    speaker_notes: Optional[str] = ""
    estimated_duration_seconds: Optional[int] = 60


class SlideCreate(SlideBase):
    pass


class SlideOut(SlideBase):
    id: str
    presentation_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# Presentation Schemas
class PresentationBase(BaseModel):
    title: str
    description: Optional[str] = None
    category: Optional[str] = "General"
    theme: Optional[str] = "dark"


class PresentationCreate(PresentationBase):
    pass


class PresentationUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    theme: Optional[str] = None


class PresentationOut(PresentationBase):
    id: str
    user_id: Optional[str] = None
    file_type: str
    slides: List[SlideOut] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# AI Schemas
class GenerateDeckRequest(BaseModel):
    topic: str
    num_slides: Optional[int] = 5
    target_audience: Optional[str] = "Technical Committee / Academic Evaluators"
    tone: Optional[str] = "Professional, Authoritative, Engaging"


class GeneratedSlideSchema(BaseModel):
    slide_number: int
    title: str
    subtitle: str
    bullet_points: List[str]
    speaker_notes: str
    estimated_duration_seconds: int


class GenerateDeckResponse(BaseModel):
    title: str
    description: str
    category: str
    theme: str
    slides: List[GeneratedSlideSchema]


class SpeakerNotesRequest(BaseModel):
    slide_title: str
    slide_content: List[str]


class SpeakerNotesResponse(BaseModel):
    speaker_notes: str
    pacing_advice: str
    key_takeaway: str


class RehearsalAnalysisRequest(BaseModel):
    deck_id: str
    slide_durations: Dict[int, int]  # slide_number -> seconds spent
    words_spoken: Optional[int] = 500
    gestures_used: Optional[int] = 12


class RehearsalAnalysisResponse(BaseModel):
    overall_score: int
    avg_pace_wpm: float
    pace_status: str  # "Too Fast", "Ideal", "Too Slow"
    time_overruns: List[Dict[str, Any]]
    suggestions: List[str]
    readiness_level: str


class AudienceQnARequest(BaseModel):
    deck_title: str
    slides_summary: List[str]


class QuestionItem(BaseModel):
    question: str
    likely_asker: str  # e.g. "Lead Technical Faculty", "Industry Examiner"
    suggested_answer: str


class AudienceQnAResponse(BaseModel):
    questions: List[QuestionItem]
