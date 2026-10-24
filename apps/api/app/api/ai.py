from fastapi import APIRouter, HTTPException, status
from typing import List, Dict, Any
from app.schemas.schemas import (
    GenerateDeckRequest,
    GenerateDeckResponse,
    SpeakerNotesRequest,
    SpeakerNotesResponse,
    RehearsalAnalysisRequest,
    RehearsalAnalysisResponse,
    AudienceQnARequest,
    AudienceQnAResponse
)
from app.services.llm_service import llm_service

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


@router.post("/generate-deck", response_model=GenerateDeckResponse)
async def generate_deck_from_topic(payload: GenerateDeckRequest):
    """
    Generates a structured multi-slide presentation deck complete with speaker notes.
    """
    if not payload.topic.strip():
        raise HTTPException(status_code=400, detail="Presentation topic cannot be empty.")

    result = await llm_service.generate_deck(
        topic=payload.topic,
        num_slides=payload.num_slides or 5,
        target_audience=payload.target_audience,
        tone=payload.tone
    )
    return result


@router.post("/speaker-notes", response_model=SpeakerNotesResponse)
async def generate_notes(payload: SpeakerNotesRequest):
    """
    Generates narrative speaker cue notes and pacing advice for any slide.
    """
    result = await llm_service.generate_speaker_notes(
        slide_title=payload.slide_title,
        slide_content=payload.slide_content
    )
    return result


@router.post("/rehearsal-feedback", response_model=RehearsalAnalysisResponse)
async def analyze_rehearsal_delivery(payload: RehearsalAnalysisRequest):
    """
    AI Rehearsal Coach: analyzes time spent per slide, speech cadence, and provides recommendations.
    """
    result = await llm_service.analyze_rehearsal(
        deck_id=payload.deck_id,
        slide_durations=payload.slide_durations,
        words_spoken=payload.words_spoken or 500,
        gestures_used=payload.gestures_used or 12
    )
    return result


@router.post("/audience-qna", response_model=AudienceQnAResponse)
async def get_audience_qna(payload: AudienceQnARequest):
    """
    Anticipates likely questions from examination faculty and suggests answers.
    """
    questions = await llm_service.generate_audience_qna(
        deck_title=payload.deck_title,
        slides_summary=payload.slides_summary
    )
    return {"questions": questions}
