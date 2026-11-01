import { GestureType, GestureState, GestureEvent, Handedness } from './types';

export interface StateMachineConfig {
  armedHoldDurationMs: number; // Duration to hold open palm to arm (default: 300ms)
  fistHoldDurationMs: number;  // Duration to hold fist to pause (default: 600ms)
  cooldownMs: number;          // Refractory deadtime after a discrete gesture (default: 380ms)
  minConfidence: number;       // Minimum confidence required to fire (default: 0.65)
  autoArmOnDetection?: boolean;// Automatically arm when a hand is detected (default: true)
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
    const autoArm = config.autoArmOnDetection ?? (config.armedHoldDurationMs !== undefined ? false : true);
    this.config = {
      armedHoldDurationMs: config.armedHoldDurationMs ?? 300,
      fistHoldDurationMs: config.fistHoldDurationMs ?? 600,
      cooldownMs: config.cooldownMs ?? 380,
      minConfidence: config.minConfidence ?? 0.65,
      autoArmOnDetection: autoArm,
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
    // 1. Check for Pause Lockout (Closed Fist held from any state)
    if (detectedGesture === 'FIST' && confidence >= this.config.minConfidence) {
      if (this.fistStartTime === null) {
        this.fistStartTime = timestamp;
      } else if (timestamp - this.fistStartTime >= this.config.fistHoldDurationMs) {
        if (this.state !== 'PAUSED') {
          this.setState('PAUSED');
          this.fistStartTime = null;
          this.openPalmStartTime = null;
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
      // If paused, require sustained open palm to unpause
      if (this.state === 'PAUSED') {
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

      // If IDLE:
      // When autoArmOnDetection is enabled, arm immediately on any valid gesture
      if (this.config.autoArmOnDetection && detectedGesture !== 'NONE') {
        this.setState('ARMED');
        this.openPalmStartTime = null;
        // Proceed directly into ARMED handling below so initial swipe/point is not lost!
      } else if (detectedGesture === 'OPEN_PALM' && confidence >= this.config.minConfidence) {
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
        return null;
      } else {
        this.openPalmStartTime = null;
        return null;
      }
    }

    // 3. Handle ARMED or EXECUTING state
    if (this.state === 'ARMED' || this.state === 'EXECUTING') {
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

        // Fire registered action event callback (if any)
        this.onActionEventCallback?.(event);

        // Reset back to ARMED after cooldown
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
