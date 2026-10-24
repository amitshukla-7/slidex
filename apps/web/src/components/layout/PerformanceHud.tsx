import * as React from 'react';
import { useAppStore } from '@/stores/appStore';
import { Activity, Cpu, Gauge, Zap, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PerformanceHud() {
  const { showPerformanceHud, setShowPerformanceHud, performance, gestureState, currentGesture } = useAppStore();
  const [minimized, setMinimized] = React.useState(false);

  if (!showPerformanceHud) return null;

  return (
    <aside
      aria-label="Vision Performance HUD"
      className={cn(
        'fixed top-16 right-4 z-40 rounded-lg border border-border/80 bg-card/85 backdrop-blur-md shadow-xl text-xs font-mono transition-all duration-200 select-none',
        minimized ? 'w-auto' : 'w-64'
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2 bg-muted/30 rounded-t-lg">
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span className="font-semibold text-[11px] text-foreground tracking-tight">VISION HUD</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="text-muted-foreground hover:text-foreground text-[10px] px-1 rounded hover:bg-muted"
            title={minimized ? 'Expand' : 'Collapse'}
          >
            {minimized ? '+' : '−'}
          </button>
          <button
            onClick={() => setShowPerformanceHud(false)}
            className="text-muted-foreground hover:text-foreground p-0.5 rounded hover:bg-muted"
            title="Close HUD"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {minimized ? (
        <div className="px-3 py-1.5 text-[11px] flex items-center gap-2">
          <span className="text-emerald-500 font-semibold">{performance.fps} FPS</span>
          <span className="text-muted-foreground">•</span>
          <span>{performance.latencyMs}ms</span>
        </div>
      ) : (
        <div className="p-3 space-y-2.5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded border border-border/50 bg-background/40 p-2">
              <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Gauge className="h-2.5 w-2.5" /> Pipeline FPS
              </div>
              <div className="text-base font-bold text-foreground mt-0.5 flex items-baseline gap-1">
                <span className={performance.fps >= 28 ? 'text-emerald-500' : 'text-amber-500'}>
                  {performance.fps}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">/ 60</span>
              </div>
            </div>

            <div className="rounded border border-border/50 bg-background/40 p-2">
              <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1">
                <Zap className="h-2.5 w-2.5" /> E2E Latency
              </div>
              <div className="text-base font-bold text-foreground mt-0.5 flex items-baseline gap-1">
                <span className={performance.latencyMs <= 45 ? 'text-emerald-500' : 'text-amber-500'}>
                  {performance.latencyMs}
                </span>
                <span className="text-[10px] text-muted-foreground font-normal">ms</span>
              </div>
            </div>
          </div>

          {/* Detailed Telemetry */}
          <div className="space-y-1 text-[11px] border-t border-border/50 pt-2 text-muted-foreground">
            <div className="flex justify-between items-center">
              <span>Confidence:</span>
              <span className="text-foreground font-semibold">
                {(performance.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Worker Thread:</span>
              <span className="text-foreground">{performance.workerLatencyMs} ms</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Dominant Hand:</span>
              <span className="text-foreground">{performance.activeHand}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>State Machine:</span>
              <span className={cn(
                'capitalize font-semibold text-[10px] px-1.5 py-0.2 rounded',
                gestureState === 'armed' && 'bg-emerald-500/20 text-emerald-400',
                gestureState === 'idle' && 'bg-amber-500/20 text-amber-400',
                gestureState === 'paused' && 'bg-zinc-500/20 text-zinc-400',
                gestureState === 'executing' && 'bg-primary/20 text-primary'
              )}>
                {gestureState}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-border/30">
              <span>Detected Gesture:</span>
              <span className="text-primary font-bold">{currentGesture}</span>
            </div>
          </div>

          <div className="text-[9px] text-muted-foreground/60 text-center tracking-tight">
            MediaPipe WASM + GPU Delegate
          </div>
        </div>
      )}
    </aside>
  );
}
