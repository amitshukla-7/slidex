export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export type HandLandmarks = Point3D[]; // 21 points defined by MediaPipe

export type Handedness = 'Left' | 'Right';

export type GestureType =
  | 'NONE'
  | 'OPEN_PALM'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'POINTING'
  | 'PINCH'
  | 'FIST'
  | 'THUMBS_UP'
  | 'TWO_FINGERS'
  | 'PALM_WIPE'
  | 'CUSTOM';

export type GestureState = 'IDLE' | 'ARMED' | 'PAUSED' | 'EXECUTING';

export interface GestureEvent {
  gesture: GestureType;
  state: GestureState;
  confidence: number;
  timestamp: number;
  handedness: Handedness;
  pointerCoord?: { x: number; y: number };
  pinchCoord?: { x: number; y: number };
  zoomFactor?: number;
}

export interface OneEuroConfig {
  minCutoff: number; // fcmin: minimum cutoff frequency (Hz)
  beta: number;      // speed coefficient
  dCutoff: number;   // cutoff frequency for derivative (Hz)
}

export interface VisionMetrics {
  fps: number;
  latencyMs: number;
  confidence: number;
  dominantHand: Handedness;
  workerProcessingTimeMs: number;
  activeGesture: GestureType;
  stateMachineState: GestureState;
}

export interface LandmarkDetectionResult {
  landmarks: HandLandmarks[];
  handedness: Handedness[];
  timestamp: number;
}
