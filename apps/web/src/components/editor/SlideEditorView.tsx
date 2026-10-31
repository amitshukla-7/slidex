import * as React from 'react';
import { 
  Play, 
  Plus, 
  Trash2, 
  Copy, 
  Type, 
  List, 
  Square, 
  Palette, 
  Clock, 
  FileText, 
  Save, 
  ArrowLeft,
  ChevronDown,
  Layers
} from 'lucide-react';
import { usePresentationStore, type Slide, type SlideElement } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function SlideEditorView() {
  const { 
    presentations, 
    currentPresentationId, 
    currentSlideIndex, 
    setCurrentSlideIndex, 
    updateSpeakerNotes 
  } = usePresentationStore();

  const { setCurrentView } = useAppStore();
  const { addToast } = useToastStore();

  const currentDeck = presentations.find((p) => p.id === currentPresentationId);
  const slides = currentDeck?.slides || [];
  const currentSlide = slides[currentSlideIndex];

  // Local editable draft state for active slide
  const [slideTitle, setSlideTitle] = React.useState(currentSlide?.title || '');
  const [slideSubtitle, setSlideSubtitle] = React.useState(currentSlide?.subtitle || '');
  const [speakerNotes, setSpeakerNotes] = React.useState(currentSlide?.speakerNotes || '');

  React.useEffect(() => {
    if (currentSlide) {
      setSlideTitle(currentSlide.title);
      setSlideSubtitle(currentSlide.subtitle || '');
      setSpeakerNotes(currentSlide.speakerNotes || '');
    }
  }, [currentSlideIndex, currentSlide]);

  const handleSaveSlide = () => {
    if (!currentDeck || !currentSlide) return;

    // Mutate presentation store directly
    usePresentationStore.setState((state) => {
      const updated = state.presentations.map((p) => {
        if (p.id !== state.currentPresentationId) return p;
        const newSlides = p.slides.map((s, idx) => {
          if (idx !== state.currentSlideIndex) return s;
          return {
            ...s,
            title: slideTitle,
            subtitle: slideSubtitle,
            speakerNotes,
          };
        });
        return { ...p, slides: newSlides };
      });
      return { presentations: updated };
    });

    addToast({
      title: 'Slide Saved',
      description: 'Slide content and speaker notes updated.',
      type: 'success',
    });
  };

  const handleAddSlide = () => {
    if (!currentDeck) return;
    const newSlideNum = slides.length + 1;
    const newSlide: Slide = {
      id: `${currentDeck.id}-s${Date.now()}`,
      slideNumber: newSlideNum,
      title: 'New Slide Title',
      subtitle: 'Add subtitle or context',
      estimatedDurationSeconds: 60,
      speakerNotes: 'Enter speaker notes here.',
      annotations: [],
      elements: [
        {
          id: `el-${Date.now()}-1`,
          type: 'bullet_list',
          content: [
            'First major talking point',
            'Supporting technical evidence or result',
            'Action item or takeaway',
          ],
        },
      ],
    };

    usePresentationStore.setState((state) => {
      const updated = state.presentations.map((p) => {
        if (p.id !== state.currentPresentationId) return p;
        return { ...p, slides: [...p.slides, newSlide] };
      });
      return {
        presentations: updated,
        currentSlideIndex: slides.length,
      };
    });

    addToast({
      title: 'Slide Added',
      description: `Created Slide ${newSlideNum}`,
      type: 'default',
    });
  };

  const handleDeleteSlide = (indexToDelete: number) => {
    if (slides.length <= 1) {
      addToast({
        title: 'Cannot Delete',
        description: 'A deck must contain at least one slide.',
        type: 'warning',
      });
      return;
    }

    usePresentationStore.setState((state) => {
      const updated = state.presentations.map((p) => {
        if (p.id !== state.currentPresentationId) return p;
        const newSlides = p.slides
          .filter((_, idx) => idx !== indexToDelete)
          .map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
        return { ...p, slides: newSlides };
      });
      return {
        presentations: updated,
        currentSlideIndex: Math.max(0, indexToDelete - 1),
      };
    });
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground animate-in fade-in-0 duration-200">
      {/* Top Action Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card px-6 select-none shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentView('dashboard')}
            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>

          <span className="text-muted-foreground/40">•</span>
          <span className="font-semibold text-xs text-foreground tracking-tight">
            {currentDeck?.title}
          </span>
          <Badge variant="outline" className="font-mono text-[10px]">
            {slides.length} Slides
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleSaveSlide} className="h-8 gap-1.5 text-xs">
            <Save className="h-3.5 w-3.5" />
            Save Slide
          </Button>
          <Button
            size="sm"
            onClick={() => setCurrentView('presenter')}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Start Presenting
          </Button>
        </div>
      </div>

      {/* Editor Body: 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Pane: Slide Thumbnail List */}
        <div className="w-64 border-r border-border bg-muted/20 flex flex-col justify-between shrink-0">
          <div className="flex items-center justify-between border-b border-border p-3">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Slides
            </span>
            <Button size="sm" variant="ghost" onClick={handleAddSlide} className="h-7 px-2 gap-1 text-xs text-primary">
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {slides.map((s, idx) => {
              const isSelected = idx === currentSlideIndex;

              return (
                <div
                  key={s.id}
                  onClick={() => setCurrentSlideIndex(idx)}
                  className={cn(
                    'group relative aspect-[16/9] w-full rounded-xl border p-3 text-left transition-all cursor-pointer flex flex-col justify-between overflow-hidden',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/30 bg-card shadow-sm'
                      : 'border-border bg-card/60 hover:border-primary/40'
                  )}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                    <span>{idx + 1}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSlide(idx);
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">
                    {s.title}
                  </p>

                  <span className="text-[10px] text-muted-foreground font-mono">
                    ~{s.estimatedDurationSeconds}s
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Pane: WYSIWYG Slide Canvas */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/10 overflow-y-auto">
          <div className="aspect-[16/9] w-full max-w-4xl rounded-2xl border border-border bg-card p-10 shadow-lg flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <input
                type="text"
                value={slideTitle}
                onChange={(e) => setSlideTitle(e.target.value)}
                placeholder="Slide Title..."
                className="w-full text-2xl sm:text-3xl font-extrabold tracking-tight bg-transparent text-foreground outline-none border-b border-transparent hover:border-border focus:border-primary transition-colors pb-1"
              />

              <input
                type="text"
                value={slideSubtitle}
                onChange={(e) => setSlideSubtitle(e.target.value)}
                placeholder="Slide Subtitle or context..."
                className="w-full text-sm sm:text-base text-muted-foreground bg-transparent outline-none border-b border-transparent hover:border-border focus:border-primary transition-colors pb-1"
              />
            </div>

            {/* Slide Elements Preview */}
            <div className="flex-1 space-y-3 py-4">
              {currentSlide?.elements.map((el) => {
                if (el.type === 'bullet_list' && Array.isArray(el.content)) {
                  return (
                    <ul key={el.id} className="space-y-2 text-sm text-foreground/90">
                      {el.content.map((item: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }

                if (el.type === 'callout') {
                  return (
                    <div key={el.id} className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-xs text-primary font-medium">
                      {el.content}
                    </div>
                  );
                }

                return (
                  <p key={el.id} className="text-sm text-muted-foreground">
                    {el.content}
                  </p>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3 font-mono">
              <span>slideX Canvas Engine</span>
              <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
            </div>
          </div>
        </div>

        {/* Right Pane: Slide Properties & Notes Editor */}
        <div className="w-80 border-l border-border bg-card p-5 space-y-6 overflow-y-auto shrink-0">
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider font-mono">
              Slide Properties
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Customize timing, notes, and layout
            </p>
          </div>

          {/* Timing estimate */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              Target Duration (Seconds)
            </label>
            <Input
              type="number"
              defaultValue={currentSlide?.estimatedDurationSeconds || 60}
              className="h-8 text-xs font-mono"
            />
          </div>

          {/* Speaker Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" />
              Speaker Notes
            </label>
            <textarea
              value={speakerNotes}
              onChange={(e) => setSpeakerNotes(e.target.value)}
              placeholder="Private cues and talking points..."
              rows={8}
              className="w-full rounded-lg border border-input bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring leading-relaxed"
            />
            <p className="text-[10px] text-muted-foreground">
              Displayed in the Speaker View drawer during presentation delivery.
            </p>
          </div>

          {/* Theme selector */}
          <div className="space-y-2 pt-2 border-t border-border">
            <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5 text-primary" />
              Deck Theme
            </label>
            <select
              defaultValue={currentDeck?.theme || 'dark'}
              className="w-full h-8 rounded-lg border border-input bg-background px-3 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="dark">Dark Kinetic</option>
              <option value="light">Minimal Light</option>
              <option value="midnight">Midnight Indigo</option>
              <option value="academic">Academic Slate</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
