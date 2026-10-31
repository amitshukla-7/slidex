import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import engine, Base

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data


def test_auth_workflow():
    unique_email = f"evaluator_{int(time.time())}@slidex.io"
    # Register
    reg_res = client.post(
        "/api/v1/auth/register",
        json={
            "email": unique_email,
            "full_name": "Senior Evaluator",
            "password": "StrongPassword123!",
        },
    )
    assert reg_res.status_code == 201
    user_data = reg_res.json()
    assert user_data["email"] == unique_email
    assert "id" in user_data

    # Login
    login_res = client.post(
        "/api/v1/auth/login",
        json={
            "email": unique_email,
            "password": "StrongPassword123!",
        },
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    # Get Current User
    auth_headers = {"Authorization": f"Bearer {token_data['access_token']}"}
    me_res = client.get("/api/v1/auth/me", headers=auth_headers)
    assert me_res.status_code == 200
    assert me_res.json()["email"] == unique_email


def test_ai_generate_deck():
    response = client.post(
        "/api/v1/ai/generate-deck",
        json={
            "topic": "Autonomous Drone Navigation with Edge Vision",
            "num_slides": 4,
            "target_audience": "Technical Evaluation Panel",
            "tone": "Academic, Rigorous",
        },
    )
    assert response.status_code == 200
    deck = response.json()
    assert "title" in deck
    assert len(deck["slides"]) == 4
    for slide in deck["slides"]:
        assert "title" in slide
        assert "subtitle" in slide
        assert "bullet_points" in slide
        assert "speaker_notes" in slide


def test_ai_speaker_notes():
    response = client.post(
        "/api/v1/ai/speaker-notes",
        json={
            "slide_title": "1-Euro Filter Kinematics",
            "slide_content": [
                "Adaptive cutoff frequency calculation based on instantaneous derivative of position",
                "High beta parameter dynamically reduces lag during fast hand sweeps",
                "Minimum cutoff frequency eliminates human micro-tremor when pointing"
            ],
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "speaker_notes" in data
    assert "pacing_advice" in data
    assert "key_takeaway" in data
    assert len(data["speaker_notes"]) > 20


def test_ai_rehearsal_feedback():
    response = client.post(
        "/api/v1/ai/rehearsal-feedback",
        json={
            "deck_id": "deck-sample-123",
            "slide_durations": {1: 45, 2: 90, 3: 60},
            "words_spoken": 420,
            "gestures_used": 19,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "avg_pace_wpm" in data
    assert "pace_status" in data
    assert "suggestions" in data
    assert len(data["suggestions"]) >= 2


def test_ai_audience_qna():
    response = client.post(
        "/api/v1/ai/audience-qna",
        json={
            "deck_title": "slideX Evaluation",
            "slides_summary": [
                "Slide 1: High FPS MediaPipe on-device processing",
                "Slide 2: 63-parameter spatial normalization",
                "Slide 3: One Euro adaptive low-pass filter"
            ]
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "questions" in data
    assert len(data["questions"]) >= 2


def test_presentation_crud():
    # Create
    create_res = client.post(
        "/api/v1/presentations",
        json={
            "title": "B.Tech Final Year Evaluation Deck",
            "description": "Comprehensive defense of edge vision presentation framework",
            "category": "Defense",
            "theme": "keynote-dark",
        },
    )
    assert create_res.status_code == 201
    deck = create_res.json()
    assert deck["title"] == "B.Tech Final Year Evaluation Deck"
    deck_id = deck["id"]
    assert len(deck["slides"]) == 1

    # List
    list_res = client.get("/api/v1/presentations")
    assert list_res.status_code == 200
    decks = list_res.json()
    assert any(d["id"] == deck_id for d in decks)

    # Get Single
    get_res = client.get(f"/api/v1/presentations/{deck_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == deck_id

    # Delete
    del_res = client.delete(f"/api/v1/presentations/{deck_id}")
    assert del_res.status_code == 204

    # Verify deleted
    get_after_del = client.get(f"/api/v1/presentations/{deck_id}")
    assert get_after_del.status_code == 404

