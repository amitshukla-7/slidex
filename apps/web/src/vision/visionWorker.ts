import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

let handLandmarker: HandLandmarker | null = null;
let isInitializing = false;

self.onmessage = async (e: MessageEvent) => {
  const { type, data } = e.data;

  if (type === 'INIT') {
    if (handLandmarker || isInitializing) return;
    isInitializing = true;

    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );

      handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numHands: 1,
        minHandDetectionConfidence: 0.65,
        minHandPresenceConfidence: 0.65,
        minTrackingConfidence: 0.65,
      });

      self.postMessage({ type: 'INIT_SUCCESS' });
    } catch (err: any) {
      // Fallback to CPU delegate in worker
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
        );
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'CPU',
          },
          runningMode: 'IMAGE',
          numHands: 1,
        });
        self.postMessage({ type: 'INIT_SUCCESS' });
      } catch (cpuErr: any) {
        self.postMessage({ type: 'INIT_ERROR', error: cpuErr?.message || 'Worker init failed' });
      }
    } finally {
      isInitializing = false;
    }
  } else if (type === 'PROCESS_FRAME') {
    if (!handLandmarker) {
      self.postMessage({ type: 'FRAME_RESULT', landmarks: [], handedness: [] });
      return;
    }

    const { imageBitmap, timestamp } = data;
    try {
      const results = handLandmarker.detect(imageBitmap);
      imageBitmap.close(); // Release transferred bitmap

      self.postMessage({
        type: 'FRAME_RESULT',
        landmarks: results.landmarks,
        handedness: results.handedness,
        timestamp,
      });
    } catch (err) {
      if (imageBitmap && typeof imageBitmap.close === 'function') {
        imageBitmap.close();
      }
      self.postMessage({ type: 'FRAME_RESULT', landmarks: [], handedness: [], timestamp });
    }
  }
};
