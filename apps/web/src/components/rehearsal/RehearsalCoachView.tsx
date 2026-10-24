import * as React from 'react';
import { 
  Mic2, 
  Play, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  HelpCircle, 
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  Zap,
  Share2
} from 'lucide-react';
import { usePresentationStore } from '@/stores/presentationStore';
import { useAppStore } from '@/stores/appStore';
import { useToastStore } from '@/stores/toastStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export function RehearsalCoachView() {
  const { presentations, currentPresentationId } = usePresentationStore();
  const { setCurrentView } = useAppStore();
  const { addToast } = useToastStore();

  const currentDeck = presentations.find((p) => p.id === currentPresentationId);

  // Simulated live rehearsal benchmark data
  const sessionData = {
    overallScore: 94,
    paceWpm: 132,
    paceStatus: 'Ideal Cadence (120 - 145 WPM)',
    totalTimeSeconds: 340, // 5m 40s
    gesturesUsed: 19,
    misfireRate: '< 0.3%',
    slideTimings: [
      { num: 1, title: 'Introduction', actual: 48, target: 45, status: 'on_track' },
      { num: 2, title: 'The Problem Space', actual: 68, target: 60, status: 'on_track' },
      { num: 3, title: 'System Architecture', actual: 98, target: 75, status: 'overrun' },
      { num: 4, title: 'Gesture State Machine', actual: 72, target: 70, status: 'on_track' },
      { num: 5, title: 'Experimental Results', actual: 54, target: 50, status: 'on_track' },
    ],
    aiSuggestions: [
      'Excellent conversational pace (132 WPM). Your delivery was clear and authoritative.',
      'Slide 3 ("System Architecture") took 98 seconds (23s overrun). Consider simplifying the code diagram explanation.',
      'Your virtual laser pointing was active for 42% of Slide 5, effectively directing focus to benchmark numbers.',
      'Gesture state machine activation was fast: you armed control in 1.1s and had 0 accidental triggers.',
    ],
    anticipatedQuestions: [
      {
        q: 'How does the One Euro filter eliminate laser jitter during pointing?',
        tip: 'Highlight the adaptive cutoff equation: low speed = low cutoff frequency to absorb tremor; fast speed = high cutoff to eliminate lag.',
      },
      {
        q: 'Why not process video frames on a remote server with a heavier neural network?',
        tip: 'Emphasize that client-side MediaPipe WASM avoids 200-500ms network latency and provides 100% data privacy.',
      },
      {
        q: 'What prevents accidental slide skips while talking naturally?',
        tip: 'Explain the 1-second armed hold requirement, 750ms refractory cooldown, and 60px displacement hysteresis.',
      },
    ],
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-8 animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              AI Rehearsal Coach
            </h1>
            <Badge variant="success" className="gap-1 font-mono text-[10px]">
              <Sparkles className="h-3 w-3" />
              Practice Analysis
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Session telemetry, slide-by-slide pacing audit, and personalized faculty delivery advice.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => setCurrentView('presenter')}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            Launch Live Presenter
          </Button>
        </div>
      </div>

      {/* Top Score Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-card via-card to-muted/20 p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center">
            {/* Circular score ring */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className="text-muted/40"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="#0284c7"
                strokeWidth="7"
                strokeDasharray="251"
                strokeDashoffset="15"
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-foreground">{sessionData.overallScore}</span>
              <span className="text-[9px] uppercase font-mono text-muted-foreground">Score</span>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Presentation Delivery Readiness: High</h3>
            <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
              Based on your practice run on "{currentDeck?.title}", your timing, gesture cadence, and voice flow are well within target criteria for project defense.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="text-center px-4 py-2 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-lg font-bold text-foreground font-mono">{sessionData.paceWpm}</div>
            <div className="text-[10px] text-muted-foreground">Words / Min</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-lg font-bold text-foreground font-mono">{sessionData.gesturesUsed}</div>
            <div className="text-[10px] text-muted-foreground">Gestures</div>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-muted/40 border border-border/60">
            <div className="text-lg font-bold text-emerald-500 font-mono">0.18ms</div>
            <div className="text-[10px] text-muted-foreground">Latency</div>
          </div>
        </div>
      </div>

      {/* Slide Timing Breakdown & AI Feedback Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Slide Timing Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Slide Delivery Timeline
            </h3>
            <span className="text-xs text-muted-foreground font-mono">5m 40s Total</span>
          </div>

          <div className="rounded-xl border border-border bg-card divide-y divide-border/60 overflow-hidden">
            {sessionData.slideTimings.map((s) => (
              <div key={s.num} className="p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">
                    Slide {s.num}: {s.title}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-muted-foreground">
                      {s.actual}s <span className="text-[10px]">/ {s.target}s target</span>
                    </span>
                    {s.status === 'overrun' ? (
                      <Badge variant="warning" className="text-[9px] py-0">Overrun +23s</Badge>
                    ) : (
                      <Badge variant="success" className="text-[9px] py-0">Paced</Badge>
                    )}
                  </div>
                </div>

                {/* Progress bar comparison */}
                <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden flex">
                  <div
                    style={{ width: `${Math.min(100, (s.actual / 120) * 100)}%` }}
                    className={`h-full rounded-full ${s.status === 'overrun' ? 'bg-amber-500' : 'bg-primary'}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: AI Feedback & Suggestions (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            AI Coach Recommendations
          </h3>

          <div className="space-y-2.5">
            {sessionData.aiSuggestions.map((sug, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-card text-xs">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground leading-relaxed">{sug}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anticipated Faculty Examination Q&A */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-primary" />
              Anticipated Committee Inquiries & High-Scoring Talking Points
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Practice answering these specific questions before faculty evaluation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessionData.anticipatedQuestions.map((q, idx) => (
            <Card key={idx} className="bg-card/70 border-border">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-semibold text-foreground leading-snug">
                  {q.q}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-1 text-xs text-muted-foreground leading-relaxed">
                <strong className="text-primary font-medium">Recommended response: </strong>
                {q.tip}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
