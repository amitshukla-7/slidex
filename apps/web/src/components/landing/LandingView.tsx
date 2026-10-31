import { 
  ArrowRight, 
  Play, 
  ShieldCheck, 
  Sparkles, 
  Hand, 
  Video, 
  SlidersHorizontal, 
  Mic2,
  CheckCircle2,
  Zap,
  MousePointer2,
  PenTool
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function LandingView() {
  const { setCurrentView } = useAppStore();

  return (
    <div className="min-h-full w-full bg-background text-foreground animate-in fade-in-0 duration-200">
      {/* Top Banner Notice */}
      <div className="border-b border-border bg-card/40 px-4 py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
        <Badge variant="outline" className="text-[10px] font-mono py-0 text-emerald-500 border-emerald-500/30">
          On-Device Vision
        </Badge>
        <span>Your webcam never leaves your laptop. 100% private and runs smoothly offline.</span>
      </div>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-16 pb-20 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs text-muted-foreground shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Next-Generation Presentation Tool</span>
          <span className="text-border">•</span>
          <span className="text-foreground font-medium">B.Tech Engineering Project</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground max-w-3xl mx-auto leading-[1.15]">
          Deliver presentations hands-free with natural hand gestures.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Step away from your laptop. Advance slides with a wave, point with a virtual laser, and draw annotations in the air using your webcam.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Button
            size="lg"
            onClick={() => setCurrentView('presenter')}
            className="h-11 px-6 gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
          >
            <Play className="h-4 w-4 fill-current" />
            Start Presenting Now
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setCurrentView('dashboard')}
            className="h-11 px-6 gap-2 text-sm border-border bg-card hover:bg-muted"
          >
            Open Presentation Library
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Live Interface Preview Mockup */}
        <div className="pt-10">
          <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl overflow-hidden ring-1 ring-border/50">
            {/* Window control chrome */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="h-3 w-3 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                <span className="text-xs font-medium text-foreground ml-2">slideX Presenter View</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-emerald-500">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Gestures Active (Open Palm to Arm)
              </div>
            </div>

            {/* Inner Presenter Preview Canvas */}
            <div className="relative aspect-video w-full rounded-xl bg-zinc-950 flex flex-col justify-between p-8 text-left overflow-hidden border border-border/40">
              {/* Virtual Slide Content Preview */}
              <div className="space-y-3 max-w-xl z-10">
                <Badge variant="outline" className="text-zinc-400 border-zinc-800 text-[10px] font-mono">
                  Slide 02 / 05 • Key Benefits
                </Badge>
                <h3 className="text-2xl font-bold text-zinc-100 tracking-tight">
                  Seamless Touchless Slide Navigation
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Glide your hand left or right to move forward or back. No clicker batteries to worry about, and no need to reach for your mouse during key moments.
                </p>
              </div>

              {/* Laser pointer visualization simulation */}
              <div className="absolute top-[48%] left-[62%] pointer-events-none z-20 flex items-center gap-2">
                <div className="relative">
                  <div className="h-4 w-4 rounded-full bg-red-500/30 animate-ping absolute" />
                  <div className="h-3.5 w-3.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]" />
                </div>
                <span className="rounded bg-zinc-900/90 border border-zinc-800 px-2 py-0.5 text-[10px] font-mono text-red-400">
                  Virtual Laser Pointer
                </span>
              </div>

              {/* Mini webcam PiP preview simulation */}
              <div className="absolute bottom-5 right-5 w-48 aspect-video rounded-lg border border-zinc-800 bg-zinc-900/95 p-2 z-20 shadow-xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-medium text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Webcam Preview
                  </span>
                  <span className="text-zinc-500 text-[9px]">Local</span>
                </div>
                {/* Hand skeleton simulation overlay */}
                <div className="flex items-center justify-center h-full">
                  <div className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
                    <Hand className="h-4 w-4 text-primary" />
                    <span>Hand Detected</span>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-400 text-center">
                  Open Palm: Armed
                </div>
              </div>

              {/* Bottom slide presenter controls */}
              <div className="flex items-center justify-between z-10 border-t border-zinc-800/80 pt-4 text-xs text-zinc-400">
                <div className="flex items-center gap-4">
                  <span>👈 Swipe Left: Next</span>
                  <span>•</span>
                  <span>👉 Swipe Right: Previous</span>
                  <span>•</span>
                  <span>👆 Point: Laser</span>
                  <span>•</span>
                  <span>🤏 Pinch: Draw</span>
                </div>
                <div className="font-mono">03:45 elapsed</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars (User Benefits) */}
      <section className="border-t border-border bg-card/30 py-20">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-left space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">Made For Speakers</span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Everything you need for an unforgettable presentation.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3 p-6 rounded-xl border border-border bg-card">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Hand className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Freedom to Move</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Step away from the podium and engage your audience directly. Simple, intuitive hand movements allow you to advance slides or return to previous topics naturally.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-border bg-card">
              <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500">
                <MousePointer2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Virtual Laser & Air-Drawing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Point your finger to cast an ultra-steady virtual laser pointer on any diagram, or pinch and drag to sketch annotations directly over your presentation.
              </p>
            </div>

            <div className="space-y-3 p-6 rounded-xl border border-border bg-card">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-semibold text-foreground">100% Private & Secure</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your camera video is processed entirely on your laptop. No video frames, images, or audio recordings are ever uploaded to cloud servers or stored externally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between max-w-5xl mx-auto gap-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">slideX</span>
          <span>—</span>
          <span>Touchless Presentation System</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentView('docs')} className="hover:text-foreground">
            Viva & Demo Guide
          </button>
          <button onClick={() => setCurrentView('dashboard')} className="hover:text-foreground">
            Presentations
          </button>
          <button onClick={() => setCurrentView('settings')} className="hover:text-foreground">
            Settings
          </button>
        </div>
      </footer>
    </div>
  );
}
