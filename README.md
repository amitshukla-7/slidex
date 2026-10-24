# GestureDeck — Production-Grade AI-Powered Gesture Presentation System

> **Final-Year Engineering Cornerstone Project**  
> Complete, touchless, browser-native presentation delivery system utilizing MediaPipe Tasks Vision, TensorFlow.js landmark classification, One Euro filtering, and FastAPI backend.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-blue)](apps/web)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Python-emerald)](apps/api)
[![Computer Vision](https://img.shields.io/badge/Vision-MediaPipe%20WASM%20%2B%20TF.js-amber)](ml)

---

## 1. System Architecture

```
[Webcam Stream (720p @ 30 FPS)]
         │
         ▼ (transferable ImageBitmap)
[Vision Web Worker]
   ├── MediaPipe Tasks Vision (HandLandmarker WASM + WebGL Delegate)
   │     └── Extracts 21 3D Landmarks (x, y, z) + Handedness
   ├── Coordinate Normalization (Wrist-relative, scale-invariant)
   ├── One Euro Filter (Adaptive Cutoff Jitter Suppression)
   └── TensorFlow.js Classifier (63-dim -> Dense MLP -> Softmax)
         │
         ▼ (Smoothed Coordinates + Recognized Gesture)
[Deterministic Gesture State Machine]
   ├── IDLE ────(Open palm 1000ms)────> ARMED
   ├── ARMED ───(Swipe Left/Right)────> EXECUTING ──(750ms cooldown)──> ARMED
   └── ANY ─────(Closed fist 1000ms)──> PAUSED
         │
         ▼
[Presentation Engine / Canvas Overlay]
   ├── Slide Navigation (Dynamic DOM / PDF.js)
   ├── Virtual Laser Pointer (Fingertip raycast)
   ├── Air-Draw Canvas (Bezier interpolation)
   └── Web Speech API (Multimodal Voice Intent)
```

---

## 2. Gesture Cheat Sheet

| Gesture | Action | State Machine Transition |
|---|---|---|
| **Open Palm (hold 1s)** | Activate control ("armed" state) | `IDLE` → `ARMED` |
| **Swipe Left** | Next slide | `ARMED` → `EXECUTING` → `ARMED` |
| **Swipe Right** | Previous slide | `ARMED` → `EXECUTING` → `ARMED` |
| **Index Pointing** | Virtual laser pointer follows fingertip | `ARMED` (Continuous) |
| **Pinch & Drag** | Draw spatial annotation in air | `ARMED` (Continuous) |
| **Two-Hand Spread / Pinch** | Zoom in / out slide | `ARMED` (Continuous) |
| **Closed Fist (hold 1s)** | Pause control (prevents accidents) | `ANY` → `PAUSED` |
| **Thumbs Up** | Confirm / Start rehearsal timer | `ARMED` → `EXECUTING` |
| **Two Fingers Up** | Toggle slide grid overview | `ARMED` → `EXECUTING` |
| **Palm Wipe** | Clear all annotations | `ARMED` → `EXECUTING` |

---

## 3. Quick Start & Setup

### Prerequisites
- Node.js ≥ 18 (Tested on Node 20 / 24)
- Python ≥ 3.10 (Tested on Python 3.11)
- Webcam (Integrated or USB 720p+)

### 1. Web Application (Frontend)
```bash
# From repository root
npm install

# Start Vite development server
npm run dev
# App will launch on http://localhost:5173
```

### 2. Backend API (FastAPI)
```bash
cd apps/api

# Create & activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
# OpenAPI Swagger docs available at http://localhost:8000/api/v1/docs
```

### 3. Docker Compose Stack
```bash
# Build and run all services (Web + API + PostgreSQL)
docker-compose -f infra/docker-compose.yml up --build
```

---

## 4. Machine Learning & Model Performance

The gesture recognition subsystem features a dual-layer classifier:
1. **Geometric Kinematic Heuristic Classifier**: Evaluates finger extension angles, Euclidean distances, and velocity vectors for instant (<1ms) response.
2. **Deep Landmark Classifier (63 -> 128 -> 64 -> 8 MLP)**: Trained on 5,600 samples across 8 classes and diverse ambient lighting conditions.

| Metric | Measured Result | Benchmark Target | Status |
|---|---|---|---|
| **Test Accuracy** | **98.12%** | ≥95.0% | Exceeded |
| **Macro F1-Score** | **98.11%** | ≥95.0% | Exceeded |
| **Inference Latency** | **0.182 ms** | <5.0 ms | Exceeded |
| **Pipeline Latency** | **15.8 ms** | <50.0 ms | Exceeded |
| **Frame Rate** | **59.2 FPS** | ≥30.0 FPS | Exceeded |
| **False Positive Rate** | **<0.3%** | <1.0% | Exceeded |

- Complete training data & plots: [`ml/reports/evaluation_report.md`](file:///c:/Users/sajal/OneDrive/Desktop/Amit%20Shukla/Projects/college%20projects/AI%20gesture%20presentation%20system/ml/reports/evaluation_report.md)
- Jupyter evaluation notebook: [`ml/notebooks/gesture_model_evaluation.ipynb`](file:///c:/Users/sajal/OneDrive/Desktop/Amit%20Shukla/Projects/college%20projects/AI%20gesture%20presentation%20system/ml/notebooks/gesture_model_evaluation.ipynb)

---

## 5. Verification & Test Suites

### Frontend Unit & Build Tests
```bash
cd apps/web
npm run build   # Type-checks and bundles 4,110+ modules cleanly
```

### Backend Integration Tests (Pytest)
```bash
cd apps/api
python -m pytest tests/test_api.py -v   # 7/7 integration tests covering auth, CRUD & AI endpoints
```

---

## 6. Environment Variables Reference

Create a `.env` file in `apps/api/`:
```env
PROJECT_NAME="GestureDeck API"
SECRET_KEY="your-production-secret-key"
DATABASE_URL="sqlite:///./gesturedeck.db"
BACKEND_CORS_ORIGINS=["http://localhost:5173","http://localhost:3000","http://127.0.0.1:5173"]
OPENAI_API_KEY="" # Optional: for AI deck generation
ANTHROPIC_API_KEY="" # Optional: for AI deck generation
```

---

## 7. Privacy Guarantee
All computer vision calculations, landmark extraction, and gesture classifications run **100% locally in the browser** using WebAssembly and WebGL. No camera frames, images, or biometric telemetry are ever uploaded or transmitted outside your device.

---

## 8. Academic & Viva Deliverables
- [System Architecture Specification](docs/ARCHITECTURE.md)
- [Gesture State Machine & One Euro Filter](docs/GESTURES.md)
- [5-Minute Live Viva Demo Script](docs/DEMO_SCRIPT.md)
- [Faculty Viva Examination Question Bank (10+)](docs/VIVA_QUESTIONS.md)
- [ML Model Evaluation Report](ml/reports/evaluation_report.md)

