import { GestureEvent } from './types';
import { usePresentationStore } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';

class AudioFeedbackService {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playClick(freq = 600, duration = 0.05): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  playChime(success = true): void {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const freq = success ? 880 : 440;
      this.playClick(freq, 0.08);
    } catch {
      // Ignored
    }
  }
}

const audioFeedback = new AudioFeedbackService();

export class ActionDispatcher {
  private activeStrokePoints: { x: number; y: number }[] = [];
  private isDrawing = false;

  private mapCoordinate(normX: number, normY: number): { x: number; y: number } {
    // Range expansion: maps central 76% of camera FOV to full slide canvas
    // Prevents requiring the user's hand to touch physical camera borders
    const mirroredX = 1.0 - normX;
    const clampedX = Math.max(0, Math.min(1, (mirroredX - 0.12) / 0.76));
    const clampedY = Math.max(0, Math.min(1, (normY - 0.12) / 0.76));
    return { x: clampedX, y: clampedY };
  }

  dispatch(event: GestureEvent): void {
    const { soundFeedback } = useAppStore.getState();
    const presStore = usePresentationStore.getState();
    const toastStore = useToastStore.getState();

    switch (event.gesture) {
      case 'OPEN_PALM':
        if (event.state === 'ARMED') {
          if (soundFeedback) audioFeedback.playChime(true);
          toastStore.addToast({
            title: 'Control Activated',
            description: 'Gesture control is armed. Swipe to navigate slides.',
            type: 'gesture',
          });
        }
        break;

      case 'FIST':
        if (event.state === 'PAUSED') {
          if (soundFeedback) audioFeedback.playClick(350, 0.1);
          toastStore.addToast({
            title: 'Control Paused',
            description: 'Gesture lock engaged. Hold open palm for 1s to resume.',
            type: 'warning',
          });
        }
        break;

      case 'SWIPE_LEFT':
        presStore.nextSlide();
        if (soundFeedback) audioFeedback.playClick(750, 0.06);
        toastStore.addToast({
          title: 'Next Slide',
          description: `Slide ${presStore.currentSlideIndex + 2}`,
          type: 'gesture',
        });
        break;

      case 'SWIPE_RIGHT':
        presStore.prevSlide();
        if (soundFeedback) audioFeedback.playClick(550, 0.06);
        toastStore.addToast({
          title: 'Previous Slide',
          description: `Slide ${Math.max(1, presStore.currentSlideIndex)}`,
          type: 'gesture',
        });
        break;

      case 'POINTING':
        if (event.pointerCoord) {
          const { x, y } = this.mapCoordinate(event.pointerCoord.x, event.pointerCoord.y);
          presStore.setLaserPointer({ x, y, active: true });
        }
        break;

      case 'PINCH':
        if (event.pinchCoord) {
          const { x, y } = this.mapCoordinate(event.pinchCoord.x, event.pinchCoord.y);

          this.activeStrokePoints.push({ x, y });
          this.isDrawing = true;

          // When enough points are gathered, append/update annotation with smooth continuous lines
          if (this.activeStrokePoints.length >= 2) {
            presStore.addAnnotation(presStore.currentSlideIndex, {
              id: `ann-${Date.now()}`,
              points: [...this.activeStrokePoints],
              color: presStore.activeColor,
              width: presStore.strokeWidth,
              timestamp: Date.now(),
            });
            this.activeStrokePoints = [{ x, y }]; // Continue stroke smoothly
          }
        }
        break;

      case 'PALM_WIPE':
        presStore.clearAnnotations(presStore.currentSlideIndex);
        if (soundFeedback) audioFeedback.playClick(900, 0.08);
        toastStore.addToast({
          title: 'Annotations Cleared',
          description: 'All air-drawings erased.',
          type: 'default',
        });
        break;

      case 'THUMBS_UP':
        if (soundFeedback) audioFeedback.playChime(true);
        toastStore.addToast({
          title: 'Timer Confirmed',
          description: 'Presenter timing benchmark active.',
          type: 'success',
        });
        break;

      case 'TWO_FINGERS':
        toastStore.addToast({
          title: 'Slide Overview',
          description: 'Grid view toggled.',
          type: 'default',
        });
        break;

      default:
        // Hide laser if active when non-pointing gesture occurs
        if (presStore.laserPointer.active) {
          presStore.setLaserPointer({ ...presStore.laserPointer, active: false });
        }
        // Commit drawing stroke if released
        if (this.isDrawing) {
          this.isDrawing = false;
          this.activeStrokePoints = [];
        }
        break;
    }
  }
}

export const actionDispatcher = new ActionDispatcher();
