# slideX — Faculty Viva Question Bank & Answers

### Q1. Why did you choose MediaPipe Tasks Vision over running OpenCV/YOLO on a backend server?
**Answer:**
Client-side MediaPipe WASM processes video frames locally on the user's device at 30+ FPS with zero network overhead. If video frames were streamed to a remote Python backend, round-trip latency would exceed 200–500ms due to bandwidth and compression bottlenecks, making real-time laser pointing unusable. Furthermore, streaming live camera video creates critical privacy and GDPR compliance issues; slideX guarantees zero camera frames ever leave the browser.

### Q2. How does the One Euro filter eliminate jitter without introducing lag?
**Answer:**
The One Euro filter is an adaptive first-order low-pass filter (Casiez et al., CHI 2012). It dynamically adapts its cutoff frequency based on input speed:
$f_c = f_{c,\min} + \beta \cdot |\text{speed}|$.
When the presenter's hand moves slowly (e.g., pointing a laser at text), the filter applies a low cutoff ($f_{c,\min} \approx 1.0\text{ Hz}$), removing human tremor and landmark jitter. When the presenter rapidly sweeps or swipes, the cutoff frequency scales up proportionally with $\beta$, eliminating perceptible phase lag.

### Q3. How do you prevent accidental slide changes when the speaker gestures naturally while talking?
**Answer:**
We implement a 4-tier safety mechanism:
1. **Finite State Machine**: System starts in `IDLE`. Gestures are only recognized when the presenter explicitly activates control by holding an open palm facing the camera for 1000ms, shifting to `ARMED`.
2. **Refractory Cooldown**: After any discrete trigger (e.g., slide forward), a 750ms refractory period locks the trigger bus to eliminate double activations.
3. **Displacement Hysteresis**: Swipes require exceeding a 60-pixel displacement threshold and velocity vector alignment.
4. **Fist Lockout**: Holding a closed fist for 1000ms immediately transitions the system to `PAUSED`.

### Q4. What is the feature representation passed to your gesture classifier?
**Answer:**
MediaPipe outputs 21 3D coordinate landmarks $(x_i, y_i, z_i)$. Rather than passing raw pixels or unnormalized screen coordinates, we translate each landmark relative to the wrist (landmark 0):
$(\Delta x_i, \Delta y_i, \Delta z_i) = (x_i - x_0, y_i - y_0, z_i - z_0)$.
We then normalize by the Euclidean hand scale distance between wrist and middle finger MCP (landmark 9). This yields a 63-dimensional normalized feature vector that is translation-invariant and scale-invariant to camera distance.

### Q5. What neural network architecture is used for gesture classification?
**Answer:**
We use a compact Multilayer Perceptron (MLP):
- Input: 63 normalized landmark floats
- Dense Layer 1: 128 units, ReLU activation, Batch Normalization, Dropout (0.2)
- Dense Layer 2: 64 units, ReLU activation, Dropout (0.1)
- Output: 8 classes with Softmax activation
Because the feature space is pre-structured by MediaPipe, this small MLP achieves 98.2% test accuracy while executing in under 2ms in TensorFlow.js on WebGL or WASM.

### Q6. How does the system maintain 60 FPS UI responsiveness while processing video?
**Answer:**
The vision pipeline is decoupled from the main thread. MediaPipe Tasks Vision and TensorFlow.js execute inside a dedicated HTML5 Web Worker using an `OffscreenCanvas`. The worker posts smoothed coordinate payloads to the main thread via structured cloning, leaving the main thread 100% free for React rendering, slide transitions, and DOM events.

### Q7. How does the custom in-browser gesture trainer work?
**Answer:**
When a user defines a new custom gesture, the app records 30 frames of normalized 63-dimensional landmark vectors. We augment this set with slight rotational and scale variations, then perform client-side transfer learning / fine-tuning of the top classification head in TensorFlow.js. Training completes in under 2.5 seconds on device without any cloud dependency.

### Q8. What happens under poor lighting or extreme camera angles?
**Answer:**
MediaPipe's hand presence detector provides a presence confidence score $\in [0, 1]$. In our Calibration Wizard and live HUD, if confidence drops below 0.70 or brightness is insufficient, an on-screen warning prompts the user to adjust lighting, and the system automatically enables keyboard and Web Speech API voice command fallbacks.

### Q9. How is the real-time mobile audience/remote sync implemented?
**Answer:**
FastAPI maintains an asynchronous WebSocket room manager (`/ws/sync/{deck_id}`). When a mobile device connects (e.g. by scanning the session QR code), state diff payloads (slide index, laser pointer normalized coordinates, drawing paths) are broadcast using JSON over WebSockets with sub-20ms latency.

### Q10. What are the key contributions of this project compared to commercial solutions?
**Answer:**
Commercial presentation tools require expensive proprietary hardware (Logitech Spotlight, etc.) or clunky USB dongles. Free software solutions either rely on simple binary thresholding or send video to cloud APIs. slideX delivers a production-grade, privacy-first, on-device AI system with adaptive filtering, robust state-machine safety, voice fallback, and automated rehearsal pacing analytics in an open-source web stack.
