import { GestureType, GestureState, GestureEvent, Handedness } from './types';

export interface StateMachineConfig {
  armedHoldDurationMs: number; // Duration to hold open palm to arm (default: 1000ms)
  fistHoldDurationMs: number;  // Duration to hold fist to pause (default: 1000ms)
  cooldownMs: number;          // Refractory deadtime after a discrete gesture (default: 750ms)
  minConfidence: number;       // Minimum confidence required to fire (default: 0.80)
}

export class GestureStateMachine {
  private state: GestureState = 'IDLE';
  private config: StateMachineConfig;

  // Timers and tracking state
  private openPalmStartTime: number | null = null;
  private fistStartTime: number | null = null;
  private lastActionTime: number = 0;
  private onStateChangeCallback?: (state: GestureState) => void;
  private onActionEventCallback?: (event: GestureEvent) => void;

  constructor(config: Partial<StateMachineConfig> = {}) {
    this.config = {
      armedHoldDurationMs: config.armedHoldDurationMs ?? 1000,
      fistHoldDurationMs: config.fistHoldDurationMs ?? 1000,
      cooldownMs: config.cooldownMs ?? 750,
      minConfidence: config.minConfidence ?? 0.80,
    };
  }

  getState(): GestureState {
    return this.state;
  }

  setState(newState: GestureState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.onStateChangeCallback?.(newState);
    }
  }

  onStateChange(cb: (state: GestureState) => void): void {
    this.onStateChangeCallback = cb;
  }

  onActionEvent(cb: (event: GestureEvent) => void): void {
    this.onActionEventCallback = cb;
  }

  /**
   * Main state machine transition function evaluated on each processed vision frame.
   */
  process(
    detectedGesture: GestureType,
    confidence: number,
    timestamp: number,
    handedness: Handedness = 'Right',
    metadata: any = {}
  ): GestureEvent | null {
    // 1. Check for Pause Lockout (Closed Fist held for 1s from any state)
    if (detectedGesture === 'FIST' && confidence >= this.config.minConfidence) {
      if (this.fistStartTime === null) {
        this.fistStartTime = timestamp;
      } else if (timestamp - this.fistStartTime >= this.config.fistHoldDurationMs) {
        if (this.state !== 'PAUSED') {
          this.setState('PAUSED');
          this.fistStartTime = null;
          return {
            gesture: 'FIST',
            state: 'PAUSED',
            confidence,
            timestamp,
            handedness,
          };
        }
      }
    } else {
      this.fistStartTime = null;
    }

    // 2. Handle IDLE or PAUSED state -> Transition to ARMED
    if (this.state === 'IDLE' || this.state === 'PAUSED') {
      if (detectedGesture === 'OPEN_PALM' && confidence >= this.config.minConfidence) {
        if (this.openPalmStartTime === null) {
          this.openPalmStartTime = timestamp;
        } else if (timestamp - this.openPalmStartTime >= this.config.armedHoldDurationMs) {
          this.setState('ARMED');
          this.openPalmStartTime = null;
          return {
            gesture: 'OPEN_PALM',
            state: 'ARMED',
            confidence,
            timestamp,
            handedness,
          };
        }
      } else {
        this.openPalmStartTime = null;
      }
      return null;
    }

    // 3. Handle ARMED or EXECUTING state
    if (this.state === 'ARMED' || this.state === 'EXECUTING') {
      // Check refractory cooldown for discrete triggers
      const inCooldown = timestamp - this.lastActionTime < this.config.cooldownMs;

      // Continuous gesture 1: Virtual Laser Pointer (Pointing)
      if (detectedGesture === 'POINTING' && metadata?.pointerCoord) {
        return {
          gesture: 'POINTING',
          state: 'ARMED',
          confidence,
          timestamp,
          handedness,
          pointerCoord: metadata.pointerCoord,
        };
      }

      // Continuous gesture 2: Air-Draw (Pinch & Drag)
      if (detectedGesture === 'PINCH' && metadata?.pinchCoord) {
        return {
          gesture: 'PINCH',
          state: 'ARMED',
          confidence,
          timestamp,
          handedness,
          pinchCoord: metadata.pinchCoord,
        };
      }

      // Discrete Action Gestures (Subject to refractory cooldown to avoid multi-firing)
      const isDiscreteAction = [
        'SWIPE_LEFT',
        'SWIPE_RIGHT',
        'THUMBS_UP',
        'TWO_FINGERS',
        'PALM_WIPE',
      ].includes(detectedGesture);

      if (isDiscreteAction && !inCooldown && confidence >= this.config.minConfidence) {
        this.lastActionTime = timestamp;
        this.setState('EXECUTING');

        const event: GestureEvent = {
          gesture: detectedGesture,
          state: 'EXECUTING',
          confidence,
          timestamp,
          handedness,
        };

        // Fire callback and return
        this.onActionEventCallback?.(event);

        // Schedule reset back to ARMED after cooldown
        setTimeout(() => {
          if (this.state === 'EXECUTING') {
            this.setState('ARMED');
          }
        }, this.config.cooldownMs);

        return event;
      }
    }

    return null;
  }

  updateConfig(config: Partial<StateMachineConfig>): void {
    this.config = { ...this.config, ...config };
  }

  reset(): void {
    this.state = 'IDLE';
    this.openPalmStartTime = null;
    this.fistStartTime = null;
    this.lastActionTime = 0;
  }
}
