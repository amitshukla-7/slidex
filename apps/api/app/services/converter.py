import os
import subprocess
import logging
from typing import Dict, Any, List
import pypdf
from pptx import Presentation as PptxPresentation

logger = logging.getLogger("slidex.converter")


class PresentationConverter:
    @staticmethod
    def extract_from_pptx(file_path: str) -> Dict[str, Any]:
        """
        Extracts slides, shapes, bullet points, and speaker notes from a PowerPoint (.pptx) file.
        """
        prs = PptxPresentation(file_path)
        slides_data = []

        for idx, slide in enumerate(prs.slides):
            title = f"Slide {idx + 1}"
            subtitle = ""
            bullets = []
            speaker_notes = ""

            # Extract slide text frames
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if not text:
                            continue

                        # Check if title shape
                        if shape == slide.shapes.title:
                            title = text
                        elif not subtitle and len(text) < 80 and not bullets:
                            subtitle = text
                        else:
                            bullets.append(text)

            # Extract slide notes
            if slide.has_notes_slide and slide.notes_slide.notes_text_frame:
                speaker_notes = slide.notes_slide.notes_text_frame.text.strip()

            slides_data.append({
                "slide_number": idx + 1,
                "title": title or f"Slide {idx + 1}",
                "subtitle": subtitle,
                "bullet_points": bullets[:6] if bullets else ["Imported presentation content."],
                "speaker_notes": speaker_notes or f"Speaker notes for slide {idx + 1}.",
                "estimated_duration_seconds": 60
            })

        deck_title = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ").title()

        return {
            "title": deck_title,
            "description": f"Imported PowerPoint deck ({len(slides_data)} slides)",
            "category": "Imported PPTX",
            "slides": slides_data
        }

    @staticmethod
    def extract_from_pdf(file_path: str) -> Dict[str, Any]:
        """
        Extracts pages and text blocks from an Adobe PDF (.pdf) file.
        """
        reader = pypdf.PdfReader(file_path)
        slides_data = []

        for idx, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            lines = [line.strip() for line in text.split("\n") if line.strip()]

            title = lines[0] if lines else f"Page {idx + 1}"
            subtitle = lines[1] if len(lines) > 1 else ""
            bullets = lines[2:8] if len(lines) > 2 else ["Page content extracted from PDF."]

            slides_data.append({
                "slide_number": idx + 1,
                "title": title[:100],
                "subtitle": subtitle[:120],
                "bullet_points": bullets,
                "speaker_notes": f"Talking points for page {idx + 1}.",
                "estimated_duration_seconds": 60
            })

        deck_title = os.path.splitext(os.path.basename(file_path))[0].replace("_", " ").title()

        return {
            "title": deck_title,
            "description": f"Imported PDF deck ({len(slides_data)} pages)",
            "category": "Imported PDF",
            "slides": slides_data
        }

    @staticmethod
    def convert_pptx_to_pdf_headless(pptx_path: str, output_dir: str) -> str:
        """
        Converts PPTX to PDF using LibreOffice in headless mode if installed.
        """
        try:
            cmd = ["soffice", "--headless", "--convert-to", "pdf", pptx_path, "--outdir", output_dir]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            pdf_name = os.path.splitext(os.path.basename(pptx_path))[0] + ".pdf"
            return os.path.join(output_dir, pdf_name)
        except Exception as e:
            logger.warning(f"LibreOffice headless conversion unavailable: {e}")
            return ""


converter = PresentationConverter()
