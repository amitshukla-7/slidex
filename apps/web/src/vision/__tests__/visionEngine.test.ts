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
  const filter = new OneEuroFilter1D({ minCutoff: 1.0, beta: 0.007 });
  const val1 = filter.filter(10.0, 1000);
  assert(Math.abs(val1 - 10.0) < 1e-4, 'One Euro Filter initializes with first value');

  // Filter removes jitter
  const noisy1 = filter.filter(10.2, 1033);
  const noisy2 = filter.filter(9.8, 1066);
  assert(Math.abs(noisy2 - 10.0) < 0.2, 'One Euro Filter suppresses high-frequency jitter');

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

  // Short palm (200ms) does not arm
  sm.process('OPEN_PALM', 0.9, 1000);
  sm.process('OPEN_PALM', 0.9, 1200);
  assert(sm.getState() === 'IDLE', 'State machine requires sustained hold to arm');

  // Sustained palm (550ms) arms the system
  sm.process('OPEN_PALM', 0.9, 1550);
  assert(sm.getState() === 'ARMED', 'State machine transitions to ARMED after hold threshold');

  // Fist held for 1s causes PAUSED state
  const sm2 = new GestureStateMachine({ fistHoldDurationMs: 400 });
  sm2.setState('ARMED');
  sm2.process('FIST', 0.9, 2000);
  sm2.process('FIST', 0.9, 2450);
  assert(sm2.getState() === 'PAUSED', 'State machine transitions to PAUSED on sustained closed fist');

  return { passed, failed, results };
}
