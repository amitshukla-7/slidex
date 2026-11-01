import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { HandLandmarks, Handedness, VisionMetrics, GestureEvent } from './types';
import { HandLandmarkOneEuroFilter } from './oneEuroFilter';
import { GestureClassifier } from './gestureClassifier';
import { GestureStateMachine } from './gestureStateMachine';
import { actionDispatcher } from './actionDispatcher';
import { useAppStore } from '@/stores/appStore';
import { usePresentationStore } from '@/stores/presentationStore';

export class VisionEngine {
  private static instance: VisionEngine | null = null;

  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private stream: MediaStream | null = null;
  private isRunning = false;
  private animFrameId: number | null = null;

  // Pipeline subcomponents with high-responsiveness tuning
  private oneEuroFilter = new HandLandmarkOneEuroFilter({ minCutoff: 1.2, beta: 0.05, dCutoff: 1.0 });
  private classifier = new GestureClassifier();
  private stateMachine = new GestureStateMachine({ autoArmOnDetection: true });

  // Metrics tracking
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private lastFpsCalcTime = performance.now();
  private currentFps = 30;

  // Event callbacks
  private onFrameProcessed?: (metrics: VisionMetrics, landmarks: HandLandmarks[]) => void;

  private constructor() {
    this.stateMachine.onStateChange((state) => {
      useAppStore.getState().setGestureState(state.toLowerCase() as any);
    });

    // Sync initial sensitivity
    const initialSens = useAppStore.getState().gestureSensitivity;
    if (initialSens) {
      this.classifier.setSensitivity(initialSens);
    }
  }

  static getInstance(): VisionEngine {
    if (!VisionEngine.instance) {
      VisionEngine.instance = new VisionEngine();
    }
    return VisionEngine.instance;
  }

  getStateMachine(): GestureStateMachine {
    return this.stateMachine;
  }

  setArmed(armed: boolean): void {
    this.stateMachine.setState(armed ? 'ARMED' : 'IDLE');
  }

  /**
   * Initializes MediaPipe HandLandmarker with GPU delegate (falling back to CPU if unavailable).
   * Robust confidence thresholds (0.50) prevent hand drop during fast swipes or motion blur.
   */
  async initialize(): Promise<void> {
    if (this.handLandmarker) return;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      try {
        // Attempt GPU acceleration first
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.50,
          minHandPresenceConfidence: 0.50,
          minTrackingConfidence: 0.50,
        });
      } catch (gpuError) {
        console.warn('GPU delegate unavailable, falling back to CPU delegate:', gpuError);
        this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.50,
          minHandPresenceConfidence: 0.50,
          minTrackingConfidence: 0.50,
        });
      }
    } catch (err) {
      console.error('Failed to load MediaPipe HandLandmarker:', err);
      throw err;
    }
  }

  /**
   * Starts webcam capture and continuous vision inference loop.
   */
  async start(
    videoEl: HTMLVideoElement,
    canvasEl?: HTMLCanvasElement,
    onFrame?: (metrics: VisionMetrics, landmarks: HandLandmarks[]) => void
  ): Promise<void> {
    if (this.isRunning) return;

    await this.initialize();

    this.videoElement = videoEl;
    this.canvasElement = canvasEl || null;
    this.onFrameProcessed = onFrame;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 60, min: 30 },
          facingMode: 'user',
        },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;
      await this.videoElement.play();

      this.isRunning = true;
      this.stateMachine.reset();
      this.oneEuroFilter.reset();
      this.classifier.reset();

      // Ensure sensitivity from user settings is applied
      const sens = useAppStore.getState().gestureSensitivity;
      if (sens) {
        this.classifier.setSensitivity(sens);
      }

      this.processLoop();
    } catch (err) {
      console.error('Camera access failed:', err);
      throw err;
    }
  }

  /**
   * Continuous per-frame processing loop
   */
  private processLoop = (): void => {
    if (!this.isRunning || !this.videoElement || !this.handLandmarker) return;

    const startTime = performance.now();

    // Dynamically apply any changes to gesture sensitivity
    const currentSensitivity = useAppStore.getState().gestureSensitivity;
    if (currentSensitivity) {
      this.classifier.setSensitivity(currentSensitivity);
    }

    // Ensure video has received data
    if (this.videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      const results = this.handLandmarker.detectForVideo(this.videoElement, startTime);

      // Measure processing latency
      const latencyMs = Math.round(performance.now() - startTime);

      // FPS Calculation
      this.frameCount++;
      if (startTime - this.lastFpsCalcTime >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (startTime - this.lastFpsCalcTime));
        this.frameCount = 0;
        this.lastFpsCalcTime = startTime;
      }

      if (results.landmarks && results.landmarks.length > 0) {
        const rawLandmarks = results.landmarks[0] as HandLandmarks;
        const rawHandedness = (results.handedness?.[0]?.[0]?.categoryName as Handedness) || 'Right';
        const confidence = results.handedness?.[0]?.[0]?.score || 0.95;

        // 1. Landmark smoothing via One Euro Filter with high dynamic responsiveness
        const smoothedLandmarks = this.oneEuroFilter.filter(rawLandmarks, startTime);

        // 2. Gesture classification (tolerant kinematics & scale invariant)
        const classification = this.classifier.classify(smoothedLandmarks, startTime, rawHandedness);

        // 3. Finite State Machine evaluation
        const gestureEvent = this.stateMachine.process(
          classification.gesture,
          classification.confidence,
          startTime,
          rawHandedness,
          classification.metadata
        );

        // 4. Dispatch action exactly once
        if (gestureEvent) {
          actionDispatcher.dispatch(gestureEvent);
        } else if (classification.gesture !== 'POINTING') {
          // Turn off laser pointer if active when pointing stops
          const presState = usePresentationStore.getState();
          if (presState.laserPointer.active) {
            presState.setLaserPointer({ ...presState.laserPointer, active: false });
          }
        }

        // 5. Update HUD and telemetry store
        useAppStore.getState().setPerformance({
          fps: this.currentFps,
          latencyMs,
          confidence,
          activeHand: rawHandedness,
          workerLatencyMs: latencyMs,
        });

        useAppStore.getState().setCurrentGesture(classification.gesture);

        // 6. Render hand skeleton overlay if canvas is attached
        if (this.canvasElement) {
          this.drawSkeleton(smoothedLandmarks, classification.gesture);
        }

        this.onFrameProcessed?.(
          {
            fps: this.currentFps,
            latencyMs,
            confidence,
            dominantHand: rawHandedness,
            workerProcessingTimeMs: latencyMs,
            activeGesture: classification.gesture,
            stateMachineState: this.stateMachine.getState(),
          },
          [smoothedLandmarks]
        );
      } else {
        // No hand detected in current frame
        useAppStore.getState().setCurrentGesture('None');

        // Turn off laser pointer when hand leaves camera
        const presState = usePresentationStore.getState();
        if (presState.laserPointer.active) {
          presState.setLaserPointer({ ...presState.laserPointer, active: false });
        }

        if (this.canvasElement) {
          const ctx = this.canvasElement.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        }
      }
    }

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };

  /**
   * Draws 21-point hand skeleton on canvas overlay
   */
  private drawSkeleton(landmarks: HandLandmarks, gesture: string): void {
    if (!this.canvasElement) return;
    const ctx = this.canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);

    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    // Bone connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8],       // Index
      [5, 9], [9, 10], [10, 11], [11, 12],  // Middle
      [9, 13], [13, 14], [14, 15], [15, 16],// Ring
      [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
      [0, 17],                              // Palm base
    ];

    // Bone lines
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = gesture === 'POINTING' ? '#ef4444' : gesture.includes('SWIPE') ? '#10b981' : '#0284c7';

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    });

    // Landmark joint circles
    landmarks.forEach((p, idx) => {
      ctx.beginPath();
      ctx.arc(p.x * w, p.y * h, idx === 8 ? 5.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = idx === 8 && gesture === 'POINTING' ? '#ef4444' : '#ffffff';
      ctx.fill();
    });
  }

  stop(): void {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
    this.stateMachine.reset();
  }

  destroy(): void {
    this.stop();
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    VisionEngine.instance = null;
  }
}

export const visionEngine = VisionEngine.getInstance();
