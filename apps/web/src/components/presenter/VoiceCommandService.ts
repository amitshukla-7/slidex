import { usePresentationStore } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';

export class VoiceCommandService {
  private static instance: VoiceCommandService | null = null;
  private recognition: any = null;
  private isListening = false;
  private onCommandCallback?: (command: string) => void;

  private constructor() {
    this.initRecognition();
  }

  static getInstance(): VoiceCommandService {
    if (!VoiceCommandService.instance) {
      VoiceCommandService.instance = new VoiceCommandService();
    }
    return VoiceCommandService.instance;
  }

  private initRecognition(): void {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Web Speech API is not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript.trim().toLowerCase();
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      this.recognition.onend = () => {
        // Auto-restart if still flagged listening
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch {
            // Already started or suspended
          }
        }
      };
    } catch (e) {
      console.warn('Could not initialize SpeechRecognition:', e);
    }
  }

  start(onCommand?: (command: string) => void): boolean {
    if (!this.recognition) return false;
    this.onCommandCallback = onCommand;

    try {
      this.isListening = true;
      this.recognition.start();
      useToastStore.getState().addToast({
        title: 'Voice Assistant Active',
        description: 'Speak: "Next slide", "Previous slide", "Clear", or "Go to slide 2"',
        type: 'success',
      });
      return true;
    } catch {
      return false;
    }
  }

  stop(): void {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }
  }

  isActive(): boolean {
    return this.isListening;
  }

  private processVoiceCommand(phrase: string): void {
    const presStore = usePresentationStore.getState();
    const appStore = useAppStore.getState();
    const toastStore = useToastStore.getState();

    console.log('[Voice Command Detected]:', phrase);
    this.onCommandCallback?.(phrase);

    if (phrase.includes('next slide') || phrase === 'next' || phrase.includes('forward')) {
      presStore.nextSlide();
      toastStore.addToast({
        title: 'Voice: Next Slide',
        description: `Advanced to slide ${presStore.currentSlideIndex + 2}`,
        type: 'gesture',
      });
    } else if (
      phrase.includes('previous slide') ||
      phrase === 'previous' ||
      phrase.includes('back')
    ) {
      presStore.prevSlide();
      toastStore.addToast({
        title: 'Voice: Previous Slide',
        description: `Returned to slide ${Math.max(1, presStore.currentSlideIndex)}`,
        type: 'gesture',
      });
    } else if (phrase.includes('clear') || phrase.includes('erase')) {
      presStore.clearAnnotations(presStore.currentSlideIndex);
      toastStore.addToast({
        title: 'Voice: Annotations Cleared',
        description: 'Cleaned drawings on current slide.',
        type: 'default',
      });
    } else if (phrase.includes('laser') || phrase.includes('pointer')) {
      const current = presStore.laserPointer.active;
      presStore.setLaserPointer({ ...presStore.laserPointer, active: !current });
      toastStore.addToast({
        title: !current ? 'Voice: Laser Active' : 'Voice: Laser Off',
        description: !current ? 'Virtual pointer enabled' : 'Virtual pointer disabled',
        type: 'default',
      });
    } else if (phrase.includes('pause') || phrase.includes('lock')) {
      appStore.setGestureState('paused');
      toastStore.addToast({
        title: 'Voice: Controls Paused',
        description: 'Hand gestures locked.',
        type: 'warning',
      });
    } else if (phrase.includes('resume') || phrase.includes('arm') || phrase.includes('activate')) {
      appStore.setGestureState('armed');
      toastStore.addToast({
        title: 'Voice: Controls Armed',
        description: 'Hand gestures unlocked.',
        type: 'success',
      });
    } else {
      // Check for "go to slide X"
      const match = phrase.match(/slide\s+(\d+)/i) || phrase.match(/go to\s+(\d+)/i);
      if (match && match[1]) {
        const slideNum = parseInt(match[1], 10);
        presStore.goToSlide(slideNum - 1);
        toastStore.addToast({
          title: `Voice: Jumped to Slide ${slideNum}`,
          description: `Now presenting slide ${slideNum}`,
          type: 'gesture',
        });
      }
    }
  }
}

export const voiceCommandService = VoiceCommandService.getInstance();
