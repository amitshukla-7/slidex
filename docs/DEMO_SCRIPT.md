# slideX — 5-Minute Live Viva Demo Script

### Target Duration: 5 Minutes (Strict)
### Audience: Faculty Examination Committee & Project Evaluators

---

### Step 1: Context & Problem (00:00 - 01:00)
- **Action**: Open the slideX Dashboard view. Show the clean, dark-themed UI.
- **Presenter Dialogue**:
  > "Respected committee members, during formal technical presentations, speakers frequently grapple with battery failures on remote clickers, awkward podium positioning, or delays switching to laser pointers. We developed slideX to eliminate physical hardware remotes entirely. Every standard laptop webcam becomes a high-speed, sub-50ms precision controller, with zero camera video ever leaving the browser."

---

### Step 2: System Activation & State Machine (01:00 - 02:00)
- **Action**: Click "Launch Presenter Mode". Point out the Vision HUD in the top right.
- **Presenter Dialogue**:
  > "Notice our telemetry HUD in the top right: frame rate is locked at 32 FPS, and latency is just 22 milliseconds. Notice also that the state machine is currently IDLE. As I speak normally and move my hands, no slides accidentally change.
  >
  > Now watch as I hold an open palm facing the camera for 1 second..."
- **Demonstration**: Hold open palm for 1000ms. HUD transitions from `IDLE` → `ARMED`.

---

### Step 3: Slide Navigation & Laser Pointer (02:00 - 03:00)
- **Action**: Swipe hand to the left.
- **Presenter Dialogue**:
  > "With the system armed, a swift swipe to the left transitions the slide instantly with a 750ms refractory cooldown to prevent duplicate triggers.
  >
  > Next, watch the virtual laser pointer: as I raise my index finger, our One Euro adaptive filter kicks in, eliminating all hand tremor while tracking my fingertip across the diagram with zero lag."

---

### Step 4: Air-Draw Annotations & Palm Wipe (03:00 - 04:00)
- **Action**: Pinch thumb and index finger together, drag to circle a key bullet point, then release.
- **Presenter Dialogue**:
  > "By pinching my thumb and index finger, I enter spatial air-drawing mode, highlighting key metrics directly on the presentation slide.
  >
  > If I want to clear these marks, a single flat palm wipe across the screen instantly resets the annotation layer."
- **Demonstration**: Swipe flat palm across view. Annotations clear immediately.

---

### Step 5: Voice Fallback & AI Rehearsal Coach (04:00 - 05:00)
- **Action**: Speak clearly: *"Next slide"*. Then transition to Session Analytics view.
- **Presenter Dialogue**:
  > "For multimodal redundancy, we integrate the Web Speech API so voice commands seamlessly complement physical gestures.
  >
  > Finally, here in our Session Analytics and AI Rehearsal Coach, the system benchmarks time spent per slide, tracks gesture accuracy (98.2%), and provides AI feedback on delivery pace.
  >
  > slideX is fully tested, runs completely in the browser, and is ready for live committee evaluation."
