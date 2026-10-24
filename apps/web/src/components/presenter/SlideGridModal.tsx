import * as React from 'react';
import { usePresentationStore } from '@/stores/presentationStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Grid, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideGridModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SlideGridModal({ isOpen, onClose }: SlideGridModalProps) {
  const { presentations, currentPresentationId, currentSlideIndex, goToSlide } = usePresentationStore();

  const currentDeck = presentations.find((p) => p.id === currentPresentationId);
  const slides = currentDeck?.slides || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Grid className="h-4 w-4 text-primary" />
            <DialogTitle>Slide Grid Overview</DialogTitle>
          </div>
          <DialogDescription>
            Select any slide to jump to it instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
          {slides.map((slide, index) => {
            const isCurrent = index === currentSlideIndex;

            return (
              <button
                key={slide.id}
                onClick={() => {
                  goToSlide(index);
                  onClose();
                }}
                className={cn(
                  'group relative aspect-[16/9] w-full rounded-xl border p-4 text-left transition-all duration-150 flex flex-col justify-between overflow-hidden',
                  isCurrent
                    ? 'border-primary ring-2 ring-primary/40 bg-card shadow-md'
                    : 'border-border bg-card/60 hover:border-primary/50 hover:bg-card'
                )}
              >
                <div className="flex items-center justify-between z-10">
                  <span className="font-mono text-xs font-bold text-muted-foreground group-hover:text-foreground">
                    Slide {slide.slideNumber}
                  </span>
                  {isCurrent && (
                    <Badge variant="default" className="text-[9px] py-0 px-1.5 h-4 gap-1">
                      <Check className="h-2.5 w-2.5" />
                      Current
                    </Badge>
                  )}
                </div>

                <div className="z-10 my-auto">
                  <h4 className="text-xs font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {slide.title}
                  </h4>
                  {slide.subtitle && (
                    <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                      {slide.subtitle}
                    </p>
                  )}
                </div>

                <div className="z-10 text-[10px] text-muted-foreground font-mono">
                  ~{slide.estimatedDurationSeconds}s
                </div>
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
