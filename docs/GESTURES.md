# GestureDeck — Gesture Vocabulary & State Machine

## 1. Gesture Vocabulary Reference

| Gesture | Trigger Condition | Presentation Action | State Machine Transition |
|---|---|---|---|
| **Open Palm** | All 5 fingers extended, held steady for 1.0s | Activate gesture control | `IDLE` → `ARMED` |
| **Swipe Left** | Hand displacement &gt; 60px moving left | Advance to next slide | `ARMED` → `EXECUTING` → `ARMED` (750ms cooldown) |
| **Swipe Right** | Hand displacement &gt; 60px moving right | Return to previous slide | `ARMED` → `EXECUTING` → `ARMED` (750ms cooldown) |
| **Index Pointing** | Index extended, middle/ring/pinky curled | Virtual laser pointer follows tip | `ARMED` (continuous tracking) |
| **Pinch & Drag** | Thumb tip and index tip distance &lt; 0.05 | Air-draw colored annotation line | `ARMED` (continuous drawing) |
| **Two-Hand Spread** | Distance between both hands increasing | Zoom in on active slide | `ARMED` (continuous zoom scale) |
| **Two-Hand Pinch** | Distance between both hands decreasing | Zoom out to default scale | `ARMED` (continuous zoom scale) |
| **Closed Fist** | All fingers curled into fist, held for 1.0s | Pause gesture control (lockout) | `ANY` → `PAUSED` |
| **Thumbs Up** | Thumb pointing upwards, held for 0.5s | Start / resume rehearsal timer | `ARMED` → `EXECUTING` |
| **Two Fingers Up** | Index and middle finger extended (V-sign) | Toggle slide grid overview | `ARMED` → `EXECUTING` |
| **Palm Wipe** | Flat palm swept quickly across field | Clear all annotations | `ARMED` → `EXECUTING` |

---

## 2. Jitter Suppression & Smoothing
### One Euro Filter Formulation
Landmark coordinate $x_k$ is filtered with an adaptive cutoff frequency $f_c$:
$$f_c = f_{c,\min} + \beta \cdot |\dot{\hat{x}}_k|$$
Where:
- $f_{c,\min} = 1.0\text{ Hz}$ provides strong smoothing when the hand is still (eliminating laser tremor).
- $\beta = 0.007$ dynamically increases cutoff frequency as hand speed $|\dot{\hat{x}}_k|$ rises, eliminating lag during fast sweeps.

---

## 3. False-Positive Prevention Mechanism
1. **State Machine Locking**: Gestures are completely discarded when in `IDLE` or `PAUSED` state.
2. **Temporal Hysteresis**: Arming requires continuous detection over a 1000ms sliding buffer.
3. **Refractory Cooldown**: A 750ms deadtime follows discrete triggers (Slide Next/Prev) to prevent accidental double-skips.
4. **Dominant Hand Prioritization**: Non-dominant hand movements are disregarded during laser pointing.
