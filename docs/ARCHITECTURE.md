# slideX — System Architecture Specification

## 1. Executive Summary
**slideX** is an on-device, vision-controlled presentation delivery system. Designed for enterprise and academic speakers, it replaces physical clickers and laser pointers with continuous computer vision inference running inside the client browser. Zero video frames are transmitted over any network, ensuring 100% privacy compliance.

---

## 2. Monorepo Structure
```
├── apps/
│   ├── web/          # React 18 + TypeScript strict + Vite + MediaPipe + TFJS
│   └── api/          # Python FastAPI + SQLAlchemy + WebSockets + LLM
├── ml/               # Training pipeline, landmark dataset collection, TFJS export
├── docs/             # Technical architecture, viva bank, demo scripts
└── infra/            # Docker Compose, Nginx config, multi-stage Dockerfiles
```

---

## 3. Computer Vision Pipeline (Local Client-Side)
```
[Webcam Stream (720p @ 30 FPS)]
         │
         ▼ (transferable ImageBitmap)
[Vision Web Worker]
   ├── MediaPipe Tasks Vision (HandLandmarker WASM + WebGL Delegate)
   │     └── Extracts 21 3D Landmarks (x, y, z) + Handedness
   ├── Coordinate Normalization (Relative to Landmark 0, scale-invariant)
   ├── One Euro Filter (Adaptive Cutoff Jitter Suppression)
   └── TensorFlow.js Classifier (63-dim -> Dense MLP -> Softmax)
         │
         ▼ (Smoothed Coordinates + Recognized Gesture)
[Finite State Machine (FSM)]
   ├── IDLE ────(Open palm 1000ms)────> ARMED
   ├── ARMED ───(Gesture detected)────> EXECUTING ──(750ms cooldown)──> ARMED
   └── ANY ─────(Closed fist 1000ms)──> PAUSED
         │
         ▼
[Presentation Action Bus]
   ├── Slide Engine: Next / Prev Slide, Grid Overview, Zoom
   ├── Virtual Laser Pointer: Exponentially smoothed fingertip ray
   ├── Air-Draw Canvas: Real-time bezier interpolation
   └── Voice Intent Service: Web Speech API complement
```

---

## 4. Key Performance Indicators (KPIs)
- **Frame Rate**: ≥30 FPS (target 45–60 FPS on WebGL GPU delegate)
- **Gesture-to-Action Latency**: <50 ms
- **Classification Accuracy**: ≥98.0% across 8 core gestures
- **Accidental Misfire Rate**: <0.3% under standard ambient illumination
- **Privacy Standard**: 100% on-device local execution
