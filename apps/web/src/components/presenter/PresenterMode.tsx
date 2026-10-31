import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Minimize2, 
  MousePointer2, 
  PenTool, 
  Trash2, 
  Mic, 
  MicOff, 
  FileText, 
  Grid, 
  Share2, 
  X, 
  Camera, 
  CameraOff,
  Hand,
  Volume2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { usePresentationStore, type Slide } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';
import { visionEngine } from '@/vision/visionEngine';
import { voiceCommandService } from './VoiceCommandService';
import { PresenterCanvasOverlay } from './PresenterCanvasOverlay';
import { SpeakerNotesDrawer } from './SpeakerNotesDrawer';
import { SlideGridModal } from './SlideGridModal';
import { AudienceSyncModal } from './AudienceSyncModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function PresenterMode() {
  const { 
    presentations, 
    currentPresentationId, 
    currentSlideIndex, 
    nextSlide, 
    prevSlide, 
    laserPointer, 
    setLaserPointer, 
    clearAnnotations,
    activeColor,
    zoomLevel,
    setZoomLevel
  } = usePresentationStore();

  const { setCurrentView, gestureState, currentGesture } = useAppStore();
  const { addToast } = useToastStore();

  const currentDeck = presentations.find((p) => p.id === currentPresentationId);
  const slides = currentDeck?.slides || [];
  const currentSlide: Slide | undefined = slides[currentSlideIndex];

  // UI state
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = React.useState(false);
  const [showGridModal, setShowGridModal] = React.useState(false);
  const [showSyncModal, setShowSyncModal] = React.useState(false);
  const [isVoiceActive, setIsVoiceActive] = React.useState(false);
  const [showPipWebcam, setShowPipWebcam] = React.useState(true);
  const [drawColor, setDrawColor] = React.useState('#ef4444');

  // Video and skeleton canvas refs for PiP
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const slideContainerRef = React.useRef<HTMLDivElement>(null);

  const [containerDimensions, setContainerDimensions] = React.useState({ width: 1280, height: 720 });

  // Initialize Vision Engine on mount
  React.useEffect(() => {
    let mounted = true;

    async function startCamera() {
      if (videoRef.current && canvasRef.current) {
        try {
          await visionEngine.start(videoRef.current, canvasRef.current);
        } catch (err) {
          console.warn('Vision engine camera initialization:', err);
        }
      }
    }

    startCamera();

    return () => {
      mounted = false;
      visionEngine.stop();
      voiceCommandService.stop();
    };
  }, []);

  // Responsive slide container measurement
  React.useEffect(() => {
    const updateSize = () => {
      if (slideContainerRef.current) {
        const rect = slideContainerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Keyboard navigation shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'l' || e.key === 'L') {
        setLaserPointer({ ...laserPointer, active: !laserPointer.active });
      } else if (e.key === 'c' || e.key === 'C') {
        clearAnnotations(currentSlideIndex);
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGridModal((prev) => !prev);
      } else if (e.key === 's' || e.key === 'S') {
        setShowNotesDrawer((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleVoice();
      } else if (e.key === 'Escape') {
        if (isFullscreen) {
          document.exitFullscreen?.();
          setIsFullscreen(false);
        } else {
          setCurrentView('dashboard');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, laserPointer, currentSlideIndex, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleVoice = () => {
    if (isVoiceActive) {
      voiceCommandService.stop();
      setIsVoiceActive(false);
    } else {
      const started = voiceCommandService.start();
      setIsVoiceActive(started);
    }
  };

  const colors = ['#ef4444', '#0284c7', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black text-white select-none flex flex-col justify-between">
      {/* Top Floating Header Status Overlay */}
      <div className="absolute top-4 inset-x-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="h-8 gap-1.5 text-xs bg-black/60 backdrop-blur-md text-white hover:bg-white/20 border border-white/10"
          >
            <X className="h-4 w-4" />
            Exit Presentation
          </Button>

          <span className="text-xs font-semibold tracking-tight text-white/90 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 hidden sm:inline">
            {currentDeck?.title}
          </span>
        </div>

        {/* Live Gesture State Pill */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium">
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                gestureState === 'armed' && 'bg-emerald-500 animate-pulse',
                gestureState === 'idle' && 'bg-amber-500',
                gestureState === 'paused' && 'bg-zinc-400',
                gestureState === 'executing' && 'bg-primary animate-ping'
              )}
            />
            <span className="capitalize text-zinc-200">
              {gestureState === 'armed' ? 'Hand Controls Armed' : `Gestures: ${gestureState}`}
            </span>
            {currentGesture !== 'None' && (
              <Badge variant="outline" className="text-[10px] font-mono py-0 text-primary border-primary/40">
                {currentGesture}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Slide Canvas Container (16:9 Aspect Ratio) */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div
          ref={slideContainerRef}
          style={{ transform: `scale(${zoomLevel})` }}
          className="relative aspect-[16/9] w-full max-w-6xl max-h-[82vh] rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-black border border-white/10 shadow-2xl overflow-hidden flex flex-col justify-between p-8 sm:p-14 transition-transform duration-200"
        >
          {/* Animated Slide Content */}
          <AnimatePresence mode="wait">
            {currentSlide && (
              <motion.div
                key={currentSlide.id}
                initial={{ opacity: 0, x: 25 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -25 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex-1 flex flex-col justify-between z-10 space-y-6"
              >
                {/* Slide Title & Subtitle */}
                <div className="space-y-2">
                  <div className="text-xs font-mono tracking-widest uppercase text-primary font-semibold">
                    Slide {currentSlide.slideNumber.toString().padStart(2, '0')} / {slides.length.toString().padStart(2, '0')}
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    {currentSlide.title}
                  </h1>
                  {currentSlide.subtitle && (
                    <p className="text-base sm:text-lg text-zinc-400 font-normal">
                      {currentSlide.subtitle}
                    </p>
                  )}
                </div>

                {/* Slide Elements Layout */}
                <div className="flex-1 flex flex-col justify-center space-y-4 max-w-4xl py-2">
                  {currentSlide.elements.map((el) => {
                    if (el.type === 'bullet_list' && Array.isArray(el.content)) {
                      return (
                        <ul key={el.id} className="space-y-3 text-base sm:text-lg text-zinc-300">
                          {el.content.map((point: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3">
                              <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                              <span className="leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      );
                    }

                    if (el.type === 'callout') {
                      return (
                        <div key={el.id} className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-primary-foreground font-medium text-sm sm:text-base leading-relaxed">
                          {el.content}
                        </div>
                      );
                    }

                    if (el.type === 'metric_grid' && Array.isArray(el.content)) {
                      return (
                        <div key={el.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                          {el.content.map((item: any, idx: number) => (
                            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-1">
                              <span className="text-xs font-mono uppercase text-zinc-400">{item.label}</span>
                              <div className="text-2xl sm:text-3xl font-extrabold text-white">{item.value}</div>
                              <p className="text-[11px] text-zinc-400">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    if (el.type === 'code') {
                      return (
                        <pre key={el.id} className="p-4 rounded-xl bg-zinc-950/90 text-zinc-300 font-mono text-xs overflow-x-auto border border-white/10 leading-relaxed">
                          {el.content}
                        </pre>
                      );
                    }

                    return (
                      <p key={el.id} className="text-base sm:text-lg text-zinc-300 leading-relaxed">
                        {el.content}
                      </p>
                    );
                  })}
                </div>

                {/* Slide Footer */}
                <div className="flex items-center justify-between text-xs text-zinc-500 border-t border-white/10 pt-4 font-mono">
                  <span>slideX Touchless Engine</span>
                  <span>{currentDeck?.category}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Virtual Laser Pointer & Air-Draw Canvas Layer */}
          <PresenterCanvasOverlay
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
          />
        </div>
      </div>

      {/* Picture-in-Picture Webcam Stream with Hand Skeleton (Bottom-Right) */}
      {showPipWebcam && (
        <div className="fixed bottom-20 right-6 z-30 w-52 aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-950 border border-white/20 shadow-2xl flex flex-col justify-between">
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform -scale-x-100 absolute inset-0"
            playsInline
            muted
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* PiP Overlay Controls */}
          <div className="relative z-20 flex items-center justify-between p-2 bg-gradient-to-b from-black/80 to-transparent text-[10px] text-white">
            <span className="flex items-center gap-1 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Camera Feed
            </span>
            <button
              onClick={() => setShowPipWebcam(false)}
              className="p-0.5 rounded hover:bg-white/20"
              title="Hide webcam preview"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          <div className="relative z-20 p-2 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between text-[10px] font-mono text-zinc-400">
            <span>WASM Vision</span>
            <span className="text-emerald-400 font-semibold">{gestureState.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Bottom Floating Presenter Toolbar */}
      <div className="flex items-center justify-center p-4 z-30">
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-white/15 bg-zinc-950/80 backdrop-blur-xl px-3 py-2 shadow-2xl">
          {/* Navigation Prev / Next */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevSlide}
            disabled={currentSlideIndex === 0}
            className="h-9 w-9 text-white hover:bg-white/15 disabled:opacity-30"
            title="Previous Slide (← / Swipe Right)"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <span className="text-xs font-mono px-2 text-zinc-300">
            {currentSlideIndex + 1} / {slides.length}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={nextSlide}
            disabled={currentSlideIndex >= slides.length - 1}
            className="h-9 w-9 text-white hover:bg-white/15 disabled:opacity-30"
            title="Next Slide (→ / Swipe Left)"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          <div className="h-5 w-px bg-white/20 mx-1" />

          {/* Virtual Laser Pointer Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLaserPointer({ ...laserPointer, active: !laserPointer.active })}
            className={cn(
              'h-9 w-9 text-white hover:bg-white/15',
              laserPointer.active && 'bg-red-500/20 text-red-400 border border-red-500/40'
            )}
            title="Virtual Laser Pointer (L / Point Index Finger)"
          >
            <MousePointer2 className="h-4 w-4" />
          </Button>

          {/* Color palette for air-drawing */}
          <div className="hidden sm:flex items-center gap-1 px-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setDrawColor(c);
                  usePresentationStore.setState({ activeColor: c });
                }}
                className={cn(
                  'h-4 w-4 rounded-full transition-transform',
                  activeColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-60 hover:opacity-100'
                )}
                style={{ backgroundColor: c }}
                title={`Color ${c}`}
              />
            ))}
          </div>

          {/* Clear Annotations */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => clearAnnotations(currentSlideIndex)}
            className="h-9 w-9 text-white hover:bg-white/15"
            title="Clear Slide Annotations (C / Palm Wipe)"
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {/* Zoom Controls */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoomLevel(zoomLevel >= 2.0 ? 1.0 : zoomLevel + 0.5)}
            className={cn('h-9 w-9 text-white hover:bg-white/15', zoomLevel > 1.0 && 'text-primary')}
            title="Toggle Zoom"
          >
            {zoomLevel > 1.0 ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
          </Button>

          <div className="h-5 w-px bg-white/20 mx-1" />

          {/* Voice Assistant Mic */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleVoice}
            className={cn(
              'h-9 w-9 text-white hover:bg-white/15',
              isVoiceActive && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
            )}
            title={isVoiceActive ? 'Voice Assistant Active (Click to mute)' : 'Enable Voice Commands (M)'}
          >
            {isVoiceActive ? <Mic className="h-4 w-4 text-emerald-400" /> : <MicOff className="h-4 w-4" />}
          </Button>

          {/* Slide Grid Modal */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowGridModal(true)}
            className="h-9 w-9 text-white hover:bg-white/15"
            title="Slide Grid Overview (G / Two Fingers Up)"
          >
            <Grid className="h-4 w-4" />
          </Button>

          {/* Speaker Notes Drawer */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotesDrawer(true)}
            className={cn('h-9 w-9 text-white hover:bg-white/15', showNotesDrawer && 'bg-primary/20 text-primary')}
            title="Speaker Notes & Timer (S)"
          >
            <FileText className="h-4 w-4" />
          </Button>

          {/* Audience Mobile Sync */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSyncModal(true)}
            className="h-9 w-9 text-white hover:bg-white/15"
            title="Audience & Mobile Remote Sync"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 text-white hover:bg-white/15"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {/* PiP Camera Toggle */}
          {!showPipWebcam && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPipWebcam(true)}
              className="h-9 w-9 text-white hover:bg-white/15"
              title="Show Camera PiP"
            >
              <Camera className="h-4 w-4 text-primary" />
            </Button>
          )}
        </div>
      </div>

      {/* Speaker Notes Drawer */}
      <SpeakerNotesDrawer
        isOpen={showNotesDrawer}
        onClose={() => setShowNotesDrawer(false)}
      />

      {/* Slide Grid Modal */}
      <SlideGridModal
        isOpen={showGridModal}
        onClose={() => setShowGridModal(false)}
      />

      {/* Audience Sync Modal */}
      <AudienceSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
      />
    </div>
  );
}
