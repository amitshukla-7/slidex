import { HandLandmarks, GestureType, Handedness, Point3D } from './types';
import { LandmarkNormalizer } from './normalizer';

interface LandmarkFrame {
  landmarks: HandLandmarks;
  timestamp: number;
  palm: Point3D;
  handScale: number;
}

export class GestureClassifier {
  private history: LandmarkFrame[] = [];
  private readonly historyWindowMs = 450; // Rolling motion analysis window
  private lastSwipeTime = 0;
  private readonly swipeCooldownMs = 380; // Minimum time between consecutive swipes
  private isPinching = false;
  private sensitivity = 0.75; // Configurable sensitivity (0.1 - 1.0)

  // Landmark Indices based on MediaPipe Hand Landmarker model:
  // 0: Wrist
  // Thumb: 1: CMC, 2: MCP, 3: IP, 4: TIP
  // Index: 5: MCP, 6: PIP, 7: DIP, 8: TIP
  // Middle: 9: MCP, 10: PIP, 11: DIP, 12: TIP
  // Ring: 13: MCP, 14: PIP, 15: DIP, 16: TIP
  // Pinky: 17: MCP, 18: PIP, 19: DIP, 20: TIP

  setSensitivity(s: number): void {
    this.sensitivity = Math.max(0.1, Math.min(1.0, s));
  }

  /**
   * Classify gestures based on static hand posture and motion kinematics.
   * Tolerant to natural tilts, varied distances, and subtle variations.
   */
  classify(
    landmarks: HandLandmarks,
    timestamp: number,
    handedness: Handedness = 'Right'
  ): { gesture: GestureType; confidence: number; metadata?: any } {
    if (!landmarks || landmarks.length !== 21) {
      this.isPinching = false;
      return { gesture: 'NONE', confidence: 0 };
    }

    const wrist = landmarks[0];
    const middleMcp = landmarks[9];
    const indexMcp = landmarks[5];
    const pinkyMcp = landmarks[17];

    // Compute hand scale (approximate palm dimension) for scale-invariance
    const handScale = Math.max(
      LandmarkNormalizer.distance2D(wrist, middleMcp),
      LandmarkNormalizer.distance2D(indexMcp, pinkyMcp) * 1.2,
      0.08
    );

    // Compute palm center (centroid of palm base & knuckles)
    const palm: Point3D = {
      x: (wrist.x + indexMcp.x + middleMcp.x + pinkyMcp.x) / 4,
      y: (wrist.y + indexMcp.y + middleMcp.y + pinkyMcp.y) / 4,
      z: (wrist.z + indexMcp.z + middleMcp.z + pinkyMcp.z) / 4,
    };

    // Update temporal motion history
    this.history.push({ landmarks, timestamp, palm, handScale });
    const cutoff = timestamp - this.historyWindowMs;
    this.history = this.history.filter((h) => h.timestamp >= cutoff);

    // 1. Check for dynamic Swipes FIRST (velocity vector over recent frames)
    // Allows swiping regardless of whether fingers are open or relaxed
    const swipe = this.detectSwipe(timestamp);
    if (swipe) {
      return swipe;
    }

    // 2. Analyze finger extensions with angle and scale tolerance
    const fingers = this.getFingerStatus(landmarks, handScale);

    // 3. Pinch & Drag (Air-Draw)
    // Scale-invariant normalized pinch distance between thumb tip (4) and index tip (8)
    const rawPinchDist = LandmarkNormalizer.distance2D(landmarks[4], landmarks[8]);
    const normalizedPinchDist = rawPinchDist / handScale;

    // Hysteresis: trigger pinch easily (< 0.38), hold until clearly separated (> 0.52)
    const pinchThreshold = this.isPinching ? 0.52 : 0.38;
    if (normalizedPinchDist < pinchThreshold) {
      this.isPinching = true;
      const pinchCenter = {
        x: (landmarks[4].x + landmarks[8].x) / 2,
        y: (landmarks[4].y + landmarks[8].y) / 2,
      };
      return {
        gesture: 'PINCH',
        confidence: Math.min(1.0, 0.75 + (pinchThreshold - normalizedPinchDist) * 1.5),
        metadata: { pinchCoord: pinchCenter },
      };
    } else {
      this.isPinching = false;
    }

    // 4. Index Finger Pointing (Virtual Laser Pointer)
    // Index extended, and index fingertip clearly reaches farther than middle, ring, and pinky
    const indexTipDist = LandmarkNormalizer.distance2D(landmarks[8], wrist);
    const middleTipDist = LandmarkNormalizer.distance2D(landmarks[12], wrist);
    const ringTipDist = LandmarkNormalizer.distance2D(landmarks[16], wrist);
    const pinkyTipDist = LandmarkNormalizer.distance2D(landmarks[20], wrist);

    const isIndexDominant = (indexTipDist > middleTipDist * 1.05 || !fingers.middle) &&
                            (indexTipDist > ringTipDist * 1.08 || !fingers.ring) &&
                            (indexTipDist > pinkyTipDist * 1.08 || !fingers.pinky);

    if (fingers.index && isIndexDominant) {
      return {
        gesture: 'POINTING',
        confidence: 0.95,
        metadata: { pointerCoord: { x: landmarks[8].x, y: landmarks[8].y } },
      };
    }

    // 5. Open Palm & Palm Wipe
    // Open palm: at least 4 of 5 fingers extended, or all 4 non-thumb fingers extended
    const extendedCount = (fingers.thumb ? 1 : 0) +
      (fingers.index ? 1 : 0) +
      (fingers.middle ? 1 : 0) +
      (fingers.ring ? 1 : 0) +
      (fingers.pinky ? 1 : 0);

    const isNonThumbAllExtended = fingers.index && fingers.middle && fingers.ring && fingers.pinky;

    if (extendedCount >= 4 || isNonThumbAllExtended) {
      // Check if moving rapidly for a Palm Wipe
      if (this.detectPalmWipe(timestamp)) {
        return { gesture: 'PALM_WIPE', confidence: 0.94 };
      }
      return { gesture: 'OPEN_PALM', confidence: 0.96 };
    }

    // 6. Two Fingers Up (Peace / Slide Grid Overview)
    // Index and Middle extended, pinky curled, ring curled or semi-curled
    if (fingers.index && fingers.middle && !fingers.pinky && (!fingers.ring || middleTipDist > LandmarkNormalizer.distance2D(landmarks[16], wrist) * 1.1)) {
      return { gesture: 'TWO_FINGERS', confidence: 0.93 };
    }

    // 7. Closed Fist or Thumbs Up
    // All 4 main fingers curled
    if (!fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      // If thumb is pointing strongly upwards, classify as THUMBS_UP
      const thumbTip = landmarks[4];
      const thumbMcp = landmarks[2];
      if (thumbTip.y < thumbMcp.y - 0.05 * (handScale / 0.2) && thumbTip.y < wrist.y - 0.06) {
        return { gesture: 'THUMBS_UP', confidence: 0.92 };
      }
      return { gesture: 'FIST', confidence: 0.94 };
    }

    return { gesture: 'NONE', confidence: 0.5 };
  }

  /**
   * Determines if each finger is extended or curled with rotation & tilt invariance.
   */
  private getFingerStatus(lm: HandLandmarks, handScale: number): {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  } {
    const wrist = lm[0];

    // Check individual finger extension
    // A finger is extended if tip is farther from wrist than PIP AND tip is farther from MCP than PIP
    const isFingerExtended = (tipIdx: number, pipIdx: number, mcpIdx: number): boolean => {
      const tipToWrist = LandmarkNormalizer.distance2D(lm[tipIdx], wrist);
      const pipToWrist = LandmarkNormalizer.distance2D(lm[pipIdx], wrist);
      const tipToMcp = LandmarkNormalizer.distance2D(lm[tipIdx], lm[mcpIdx]);
      const pipToMcp = LandmarkNormalizer.distance2D(lm[pipIdx], lm[mcpIdx]);

      // Robust dual-check: distance from wrist + distance from knuckle base
      return (tipToWrist > pipToWrist * 1.05 && tipToMcp > pipToMcp * 1.1) ||
             (tipToMcp > 0.52 * handScale);
    };

    // Thumb extension check: distance between thumb tip (4) and pinky knuckle (17) / index knuckle (5)
    const thumbTip = lm[4];
    const thumbIp = lm[3];
    const thumbDistToPinky = LandmarkNormalizer.distance2D(thumbTip, lm[17]);
    const thumbIpDistToPinky = LandmarkNormalizer.distance2D(thumbIp, lm[17]);
    const thumbDistToIndex = LandmarkNormalizer.distance2D(thumbTip, lm[5]);

    const thumbExtended = thumbDistToPinky > thumbIpDistToPinky * 1.08 ||
                          thumbDistToIndex > 0.36 * handScale;

    return {
      thumb: thumbExtended,
      index: isFingerExtended(8, 6, 5),
      middle: isFingerExtended(12, 10, 9),
      ring: isFingerExtended(16, 14, 13),
      pinky: isFingerExtended(20, 18, 17),
    };
  }

  /**
   * Detects both rapid flicks (60-150ms) and smooth deliberate sweeps (150-350ms).
   * Direction mapping:
   *   Webcam image is horizontally mirrored relative to user.
   *   Presenter moving hand to user's left => raw camera dx > 0 => SWIPE_LEFT (next slide)
   *   Presenter moving hand to user's right => raw camera dx < 0 => SWIPE_RIGHT (prev slide)
   */
  private detectSwipe(timestamp: number): { gesture: GestureType; confidence: number } | null {
    if (timestamp - this.lastSwipeTime < this.swipeCooldownMs) {
      return null;
    }

    if (this.history.length < 2) return null;

    const latest = this.history[this.history.length - 1];

    // Sensitivity-based distance threshold scaling
    // Higher sensitivity = smaller hand movement required to trigger
    const baseDist = 0.082 * (1.35 - this.sensitivity * 0.5); // ~0.065 to 0.082

    // Search historical frames within a 60ms to 380ms window
    for (let i = this.history.length - 2; i >= 0; i--) {
      const past = this.history[i];
      const dt = (latest.timestamp - past.timestamp) / 1000.0;

      if (dt < 0.05) continue; // Too short to establish direction
      if (dt > 0.38) break;    // Exceeded analysis window

      const dx = latest.palm.x - past.palm.x;
      const dy = latest.palm.y - past.palm.y;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Must be predominantly horizontal (tolerant to natural 35° tilt)
      if (absDx < absDy * 1.15) continue;

      const vx = absDx / dt; // Normalized horizontal velocity (units/sec)

      // Fast Flick (quick hand snap, 50ms - 150ms)
      const isFastFlick = dt <= 0.16 && absDx >= baseDist * 0.75 && vx >= 0.42;

      // Smooth Sweep (steady deliberate hand movement, 160ms - 380ms)
      const isSmoothSweep = dt > 0.16 && absDx >= baseDist && vx >= 0.22;

      // High-Velocity Burst (instant flick)
      const isHighVelocityBurst = absDx >= baseDist * 0.65 && vx >= 0.60;

      if (isFastFlick || isSmoothSweep || isHighVelocityBurst) {
        this.lastSwipeTime = timestamp;

        // Reset history so trailing recoil motion doesn't falsely re-trigger
        this.history = [];

        // Camera coordinate mapping:
        // When presenter swipes to their left: hand moves toward camera's right (dx > 0) -> SWIPE_LEFT
        // When presenter swipes to their right: hand moves toward camera's left (dx < 0) -> SWIPE_RIGHT
        const gesture: GestureType = dx > 0 ? 'SWIPE_LEFT' : 'SWIPE_RIGHT';
        const confidence = Math.min(0.99, 0.78 + vx * 0.2);

        return { gesture, confidence };
      }
    }

    return null;
  }

  /**
   * Detects rapid horizontal palm wipe motion (wiping clean annotations).
   */
  private detectPalmWipe(timestamp: number): boolean {
    if (this.history.length < 4) return false;
    const latest = this.history[this.history.length - 1];

    for (let i = this.history.length - 2; i >= 0; i--) {
      const past = this.history[i];
      const dt = (latest.timestamp - past.timestamp) / 1000.0;
      if (dt < 0.06) continue;
      if (dt > 0.30) break;

      const dx = Math.abs(latest.palm.x - past.palm.x);
      if (dx / dt > 0.85 && dx > 0.12) {
        return true;
      }
    }
    return false;
  }

  reset(): void {
    this.history = [];
    this.lastSwipeTime = 0;
    this.isPinching = false;
  }
}
