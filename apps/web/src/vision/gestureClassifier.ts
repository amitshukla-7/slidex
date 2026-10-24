import { HandLandmarks, GestureType, Handedness, Point3D } from './types';
import { LandmarkNormalizer } from './normalizer';

interface LandmarkFrame {
  landmarks: HandLandmarks;
  timestamp: number;
}

export class GestureClassifier {
  private history: LandmarkFrame[] = [];
  private readonly historyWindowMs = 350; // Motion analysis window

  // Landmark Indices based on MediaPipe Hand Landmarker model:
  // 0: Wrist
  // Thumb: 1: CMC, 2: MCP, 3: IP, 4: TIP
  // Index: 5: MCP, 6: PIP, 7: DIP, 8: TIP
  // Middle: 9: MCP, 10: PIP, 11: DIP, 12: TIP
  // Ring: 13: MCP, 14: PIP, 15: DIP, 16: TIP
  // Pinky: 17: MCP, 18: PIP, 19: DIP, 20: TIP

  /**
   * Classify gestures based on static hand posture and motion kinematics.
   */
  classify(
    landmarks: HandLandmarks,
    timestamp: number,
    handedness: Handedness = 'Right'
  ): { gesture: GestureType; confidence: number; metadata?: any } {
    if (!landmarks || landmarks.length !== 21) {
      return { gesture: 'NONE', confidence: 0 };
    }

    // Update temporal motion history
    this.history.push({ landmarks, timestamp });
    const cutoff = timestamp - this.historyWindowMs;
    this.history = this.history.filter((h) => h.timestamp >= cutoff);

    // 1. Analyze finger extensions
    const fingers = this.getFingerStatus(landmarks);

    // 2. Check for dynamic Swipes first (velocity vector over recent frames)
    const swipe = this.detectSwipe();
    if (swipe) {
      return swipe;
    }

    // 3. Pinch & Drag (Air-Draw)
    const pinchDist = LandmarkNormalizer.distance2D(landmarks[4], landmarks[8]);
    if (pinchDist < 0.055) {
      const pinchCenter = {
        x: (landmarks[4].x + landmarks[8].x) / 2,
        y: (landmarks[4].y + landmarks[8].y) / 2,
      };
      return {
        gesture: 'PINCH',
        confidence: Math.min(1.0, (0.055 - pinchDist) / 0.04 + 0.7),
        metadata: { pinchCoord: pinchCenter },
      };
    }

    // 4. Index Finger Pointing (Virtual Laser Pointer)
    if (fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      return {
        gesture: 'POINTING',
        confidence: 0.95,
        metadata: { pointerCoord: { x: landmarks[8].x, y: landmarks[8].y } },
      };
    }

    // 5. Open Palm
    if (fingers.thumb && fingers.index && fingers.middle && fingers.ring && fingers.pinky) {
      // Check if moving rapidly for a Palm Wipe
      if (this.detectPalmWipe()) {
        return { gesture: 'PALM_WIPE', confidence: 0.92 };
      }
      return { gesture: 'OPEN_PALM', confidence: 0.96 };
    }

    // 6. Closed Fist (Safety Lockout)
    if (!fingers.index && !fingers.middle && !fingers.ring && !fingers.pinky) {
      // If thumb is pointing strongly upwards, classify as THUMBS_UP
      const thumbTip = landmarks[4];
      const wrist = landmarks[0];
      const indexMcp = landmarks[5];
      if (thumbTip.y < indexMcp.y - 0.08 && Math.abs(thumbTip.x - wrist.x) < 0.15) {
        return { gesture: 'THUMBS_UP', confidence: 0.91 };
      }
      return { gesture: 'FIST', confidence: 0.94 };
    }

    // 7. Two Fingers Up (Peace / Slide Grid Overview)
    if (fingers.index && fingers.middle && !fingers.ring && !fingers.pinky) {
      return { gesture: 'TWO_FINGERS', confidence: 0.93 };
    }

    return { gesture: 'NONE', confidence: 0.5 };
  }

  /**
   * Determines if each of the 5 fingers is extended or curled.
   */
  private getFingerStatus(lm: HandLandmarks): {
    thumb: boolean;
    index: boolean;
    middle: boolean;
    ring: boolean;
    pinky: boolean;
  } {
    const wrist = lm[0];

    // Distance from wrist to tip vs wrist to PIP/MCP
    const isExtended = (tipIdx: number, pipIdx: number, mcpIdx: number) => {
      const tipDist = LandmarkNormalizer.distance2D(lm[tipIdx], wrist);
      const pipDist = LandmarkNormalizer.distance2D(lm[pipIdx], wrist);
      return tipDist > pipDist * 1.15;
    };

    // Thumb extension check (tip 4 compared to IP 3 and MCP 2)
    const thumbDist = LandmarkNormalizer.distance2D(lm[4], lm[17]); // Distance to pinky base
    const thumbMcpDist = LandmarkNormalizer.distance2D(lm[2], lm[17]);
    const thumbExtended = thumbDist > thumbMcpDist * 1.1;

    return {
      thumb: thumbExtended,
      index: isExtended(8, 6, 5),
      middle: isExtended(12, 10, 9),
      ring: isExtended(16, 14, 13),
      pinky: isExtended(20, 18, 17),
    };
  }

  /**
   * Detects rapid horizontal hand translation across the historical window.
   */
  private detectSwipe(): { gesture: GestureType; confidence: number } | null {
    if (this.history.length < 5) return null;

    const oldest = this.history[0];
    const latest = this.history[this.history.length - 1];

    const dt = (latest.timestamp - oldest.timestamp) / 1000.0;
    if (dt < 0.1 || dt > 0.4) return null;

    const wristOld = oldest.landmarks[0];
    const wristNew = latest.landmarks[0];

    const dx = wristNew.x - wristOld.x;
    const dy = wristNew.y - wristOld.y;

    // Must be predominantly horizontal movement
    if (Math.abs(dx) > 0.18 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      const velocity = Math.abs(dx) / dt;
      if (velocity > 0.6) {
        // Because camera is mirrored: hand moving right on camera = swipe left in presentation
        const gesture: GestureType = dx > 0 ? 'SWIPE_RIGHT' : 'SWIPE_LEFT';
        return { gesture, confidence: Math.min(0.98, 0.7 + velocity * 0.2) };
      }
    }

    return null;
  }

  /**
   * Detects rapid horizontal palm wipe motion.
   */
  private detectPalmWipe(): boolean {
    if (this.history.length < 4) return false;
    const oldest = this.history[0];
    const latest = this.history[this.history.length - 1];

    const dx = Math.abs(latest.landmarks[0].x - oldest.landmarks[0].x);
    const dt = (latest.timestamp - oldest.timestamp) / 1000;
    return dt > 0.08 && dx / dt > 0.9;
  }

  reset(): void {
    this.history = [];
  }
}
