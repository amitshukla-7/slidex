import os
import json
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Presentation, Slide
from app.schemas.schemas import PresentationCreate, PresentationUpdate, PresentationOut
from app.services.converter import converter
from app.core.config import settings

router = APIRouter(prefix="/presentations", tags=["Presentations"])

UPLOAD_DIRECTORY = settings.UPLOAD_DIR
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)


@router.get("", response_model=List[PresentationOut])
def list_presentations(db: Session = Depends(get_db)):
    decks = db.query(Presentation).order_by(Presentation.created_at.desc()).all()
    # Format slides elements
    for d in decks:
        for s in d.slides:
            s.elements = json.loads(s.elements_json) if s.elements_json else []
    return decks


@router.get("/{deck_id}", response_model=PresentationOut)
def get_presentation(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Presentation).filter(Presentation.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Presentation not found")
    for s in deck.slides:
        s.elements = json.loads(s.elements_json) if s.elements_json else []
    return deck


@router.post("", response_model=PresentationOut, status_code=status.HTTP_201_CREATED)
def create_presentation(deck_in: PresentationCreate, db: Session = Depends(get_db)):
    new_deck = Presentation(
        title=deck_in.title,
        description=deck_in.description,
        category=deck_in.category,
        theme=deck_in.theme,
        file_type="scratch"
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)

    # Create default slide
    first_slide = Slide(
        presentation_id=new_deck.id,
        slide_number=1,
        title=new_deck.title,
        subtitle="Presentation created in slideX",
        elements_json=json.dumps([
            {"id": "el-1", "type": "bullet_list", "content": ["Introduction talking point", "Key technical insight"]}
        ]),
        speaker_notes="Welcome to the presentation.",
        estimated_duration_seconds=60
    )
    db.add(first_slide)
    db.commit()
    db.refresh(new_deck)

    for s in new_deck.slides:
        s.elements = json.loads(s.elements_json) if s.elements_json else []
    return new_deck


@router.delete("/{deck_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_presentation(deck_id: str, db: Session = Depends(get_db)):
    deck = db.query(Presentation).filter(Presentation.id == deck_id).first()
    if not deck:
        raise HTTPException(status_code=404, detail="Presentation not found")
    db.delete(deck)
    db.commit()
    return None


@router.post("/upload", response_model=PresentationOut, status_code=status.HTTP_201_CREATED)
async def upload_presentation_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    filename = file.filename or "uploaded_presentation"
    ext = os.path.splitext(filename)[1].lower()

    if ext not in [".pptx", ".pdf"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload a PowerPoint (.pptx) or PDF (.pdf) file."
        )

    saved_path = os.path.join(UPLOAD_DIRECTORY, filename)
    with open(saved_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Parse presentation content based on format
    if ext == ".pptx":
        extracted = converter.extract_from_pptx(saved_path)
        file_type = "pptx"
    else:
        extracted = converter.extract_from_pdf(saved_path)
        file_type = "pdf"

    new_deck = Presentation(
        title=extracted["title"],
        description=extracted["description"],
        category=extracted["category"],
        file_path=saved_path,
        file_type=file_type,
        theme="dark"
    )
    db.add(new_deck)
    db.commit()
    db.refresh(new_deck)

    # Insert parsed slides
    for s_data in extracted["slides"]:
        slide = Slide(
            presentation_id=new_deck.id,
            slide_number=s_data["slide_number"],
            title=s_data["title"],
            subtitle=s_data.get("subtitle", ""),
            elements_json=json.dumps([
                {"id": f"el-{s_data['slide_number']}", "type": "bullet_list", "content": s_data["bullet_points"]}
            ]),
            speaker_notes=s_data.get("speaker_notes", ""),
            estimated_duration_seconds=s_data.get("estimated_duration_seconds", 60)
        )
        db.add(slide)

    db.commit()
    db.refresh(new_deck)

    for s in new_deck.slides:
        s.elements = json.loads(s.elements_json) if s.elements_json else []
    return new_deck
