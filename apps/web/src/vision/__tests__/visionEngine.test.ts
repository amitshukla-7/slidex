import { OneEuroFilter1D, HandLandmarkOneEuroFilter } from '../oneEuroFilter';
import { LandmarkNormalizer } from '../normalizer';
import { GestureClassifier } from '../gestureClassifier';
import { GestureStateMachine } from '../gestureStateMachine';
import { HandLandmarks } from '../types';

// Helper to construct synthetic hand landmarks
function createMockHand(
  wrist = { x: 0.5, y: 0.8, z: 0 },
  middleMcp = { x: 0.5, y: 0.5, z: 0 },
  allExtended = true
): HandLandmarks {
  const lm: HandLandmarks = [];
  lm.push({ ...wrist }); // 0: Wrist

  // Thumb 1..4
  for (let i = 1; i <= 4; i++) {
    lm.push({ x: wrist.x - 0.05 * i, y: wrist.y - 0.05 * i, z: 0 });
  }

  // Index 5..8
  for (let i = 1; i <= 4; i++) {
    lm.push({ x: wrist.x - 0.02 * i, y: allExtended ? wrist.y - 0.08 * i : wrist.y - 0.02 * i, z: 0 });
  }

  // Middle 9..12
  for (let i = 1; i <= 4; i++) {
    lm.push({ x: middleMcp.x, y: allExtended ? middleMcp.y - 0.06 * (i - 1) : middleMcp.y + 0.02 * i, z: 0 });
  }

  // Ring 13..16
  for (let i = 1; i <= 4; i++) {
    lm.push({ x: wrist.x + 0.02 * i, y: allExtended ? wrist.y - 0.07 * i : wrist.y - 0.02 * i, z: 0 });
  }

  // Pinky 17..20
  for (let i = 1; i <= 4; i++) {
    lm.push({ x: wrist.x + 0.05 * i, y: allExtended ? wrist.y - 0.05 * i : wrist.y - 0.02 * i, z: 0 });
  }

  return lm;
}

export function runVisionEngineUnitTests(): { passed: number; failed: number; results: string[] } {
  let passed = 0;
  let failed = 0;
  const results: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✓ PASS: ${testName}`);
    } else {
      failed++;
      results.push(`✗ FAIL: ${testName}`);
      console.error(`Test failed: ${testName}`);
    }
  }

  // 1. One Euro Filter Tests
  const filter = new OneEuroFilter1D({ minCutoff: 1.2, beta: 0.05 });
  const val1 = filter.filter(10.0, 1000);
  assert(Math.abs(val1 - 10.0) < 1e-4, 'One Euro Filter initializes with first value');

  // Filter removes jitter
  const noisy1 = filter.filter(10.2, 1033);
  const noisy2 = filter.filter(9.8, 1066);
  assert(Math.abs(noisy2 - 10.0) < 0.25, 'One Euro Filter suppresses high-frequency jitter');

  // 2. Landmark Normalizer Scale & Translation Invariance Tests
  const handA = createMockHand({ x: 0.2, y: 0.2, z: 0 }, { x: 0.2, y: 0.4, z: 0 });
  const handB = createMockHand({ x: 0.8, y: 0.8, z: 0 }, { x: 0.8, y: 1.0, z: 0 }); // Translated
  const normA = LandmarkNormalizer.normalize(handA);
  const normB = LandmarkNormalizer.normalize(handB);

  let translationDiff = 0;
  for (let i = 0; i < 63; i++) {
    translationDiff += Math.abs(normA[i] - normB[i]);
  }
  assert(translationDiff < 1e-4, 'Normalizer produces identical vectors under translation');

  // 3. Gesture State Machine Tests
  const sm = new GestureStateMachine({ armedHoldDurationMs: 500, cooldownMs: 300, minConfidence: 0.7 });
  assert(sm.getState() === 'IDLE', 'State Machine starts in IDLE state');

  // Short palm (200ms) does not arm when armedHoldDurationMs is configured
  sm.process('OPEN_PALM', 0.9, 1000);
  sm.process('OPEN_PALM', 0.9, 1200);
  assert(sm.getState() === 'IDLE', 'State machine requires sustained hold to arm when hold duration is set');

  // Sustained palm (550ms) arms the system
  sm.process('OPEN_PALM', 0.9, 1550);
  assert(sm.getState() === 'ARMED', 'State machine transitions to ARMED after hold threshold');

  // Fist held for duration causes PAUSED state
  const sm2 = new GestureStateMachine({ fistHoldDurationMs: 400 });
  sm2.setState('ARMED');
  sm2.process('FIST', 0.9, 2000);
  sm2.process('FIST', 0.9, 2450);
  assert(sm2.getState() === 'PAUSED', 'State machine transitions to PAUSED on sustained closed fist');

  // 4. Fast & Smooth Swipe Detection Tests
  const classifier = new GestureClassifier();
  const handOrigin = createMockHand({ x: 0.35, y: 0.6, z: 0 }, { x: 0.35, y: 0.4, z: 0 });
  const handSwiped = createMockHand({ x: 0.52, y: 0.6, z: 0 }, { x: 0.52, y: 0.4, z: 0 }); // Moved right in camera (+x)

  // Initial position at t = 1000ms
  classifier.classify(handOrigin, 1000);
  // Fast flick 80ms later at t = 1080ms
  const swipeResult = classifier.classify(handSwiped, 1080);
  assert(
    swipeResult.gesture === 'SWIPE_LEFT',
    'Fast swipe (+x in camera = user swiped left) detected within 80ms'
  );

  // 5. Index Pointing Laser Pointer Detection
  const pointingHand = createMockHand({ x: 0.5, y: 0.7, z: 0 }, { x: 0.5, y: 0.5, z: 0 }, false);
  // Extend only index finger (landmarks 5..8)
  for (let i = 1; i <= 4; i++) {
    pointingHand[4 + i] = { x: 0.5, y: 0.7 - 0.08 * i, z: 0 };
  }
  const pointingResult = classifier.classify(pointingHand, 2000);
  assert(
    pointingResult.gesture === 'POINTING' && pointingResult.metadata?.pointerCoord !== undefined,
    'Pointing gesture recognized with pointer coordinates'
  );

  // 6. Scale-Invariant Pinch Detection
  const pinchHand = createMockHand({ x: 0.5, y: 0.7, z: 0 }, { x: 0.5, y: 0.5, z: 0 }, false);
  // Bring thumb tip (4) and index tip (8) close together
  pinchHand[4] = { x: 0.48, y: 0.45, z: 0 };
  pinchHand[8] = { x: 0.49, y: 0.45, z: 0 };
  const pinchResult = classifier.classify(pinchHand, 3000);
  assert(
    pinchResult.gesture === 'PINCH' && pinchResult.metadata?.pinchCoord !== undefined,
    'Pinch gesture recognized with pinch midpoint coordinates'
  );

  return { passed, failed, results };
}
