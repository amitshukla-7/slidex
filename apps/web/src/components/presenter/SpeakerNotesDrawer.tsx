import * as React from 'react';
import { 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  X,
  Edit3
} from 'lucide-react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatTime } from '@/lib/utils';

interface SpeakerNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpeakerNotesDrawer({ isOpen, onClose }: SpeakerNotesDrawerProps) {
  const { 
    presentations, 
    currentPresentationId, 
    currentSlideIndex, 
    updateSpeakerNotes 
  } = usePresentationStore();

  const { gestureState } = useAppStore();

  const currentDeck = presentations.find((p) => p.id === currentPresentationId);
  const currentSlide = currentDeck?.slides[currentSlideIndex];
  const nextSlide = currentDeck?.slides[currentSlideIndex + 1];

  // Presentation Timer
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(true);
  const [isEditingNotes, setIsEditingNotes] = React.useState(false);
  const [notesDraft, setNotesDraft] = React.useState(currentSlide?.speakerNotes || '');

  React.useEffect(() => {
    setNotesDraft(currentSlide?.speakerNotes || '');
  }, [currentSlideIndex, currentSlide]);

  React.useEffect(() => {
    let interval: any;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  if (!isOpen) return null;

  return (
    <aside
      aria-label="Speaker Notes Drawer"
      className="fixed inset-y-0 right-0 z-40 w-96 border-l border-border bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col justify-between animate-in slide-in-from-right-full duration-200"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm text-foreground">Speaker View</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Timing Banner */}
        <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground uppercase font-mono tracking-wider">Session Timer</span>
            <Badge variant="outline" className="font-mono text-[10px]">
              Slide {currentSlideIndex + 1} of {currentDeck?.slides.length}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold font-mono text-foreground">
              {formatTime(elapsedSeconds)}
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTimerRunning(!timerRunning)}
                className="h-8 w-8"
              >
                {timerRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setElapsedSeconds(0)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Target per slide: ~{currentSlide?.estimatedDurationSeconds || 60}s
          </div>
        </div>

        {/* Current Slide Speaker Notes */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Speaker Notes
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditingNotes) {
                  updateSpeakerNotes(currentSlideIndex, notesDraft);
                }
                setIsEditingNotes(!isEditingNotes);
              }}
              className="h-6 text-[11px] px-2 gap-1 text-primary"
            >
              <Edit3 className="h-3 w-3" />
              {isEditingNotes ? 'Save' : 'Edit'}
            </Button>
          </div>

          {isEditingNotes ? (
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              className="w-full h-36 rounded-lg border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="Add speaker notes for this slide..."
            />
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 text-xs text-muted-foreground leading-relaxed min-h-[100px] whitespace-pre-wrap">
              {currentSlide?.speakerNotes || (
                <span className="italic text-muted-foreground/60">
                  No speaker notes for this slide. Click 'Edit' to add notes.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Next Slide Preview */}
        {nextSlide ? (
          <div className="space-y-2 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground">Up Next</span>
              <span className="text-[11px] text-muted-foreground font-mono">Slide {currentSlideIndex + 2}</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 space-y-1">
              <h5 className="text-xs font-bold text-foreground line-clamp-1">{nextSlide.title}</h5>
              {nextSlide.subtitle && (
                <p className="text-[11px] text-muted-foreground line-clamp-1">{nextSlide.subtitle}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground border-t border-border/60 pt-3 italic">
            This is the final slide of the presentation.
          </div>
        )}
      </div>

      {/* Footer Gesture State */}
      <div className="border-t border-border p-3 bg-muted/20 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Gesture Control:</span>
        <Badge variant={gestureState === 'armed' ? 'success' : 'outline'} className="capitalize font-mono text-[10px]">
          {gestureState}
        </Badge>
      </div>
    </aside>
  );
}
