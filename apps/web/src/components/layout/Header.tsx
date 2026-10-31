import { 
  Search, 
  Sun, 
  Moon, 
  Activity, 
  Plus, 
  Camera, 
  MonitorPlay,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useThemeStore } from '@/stores/themeStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Header() {
  const { 
    currentView, 
    setCurrentView, 
    setCommandPaletteOpen, 
    showPerformanceHud, 
    togglePerformanceHud,
    performance
  } = useAppStore();

  const { toggleTheme, resolvedTheme } = useThemeStore();

  const viewTitles: Record<string, { title: string; subtitle: string }> = {
    landing: { title: 'Welcome', subtitle: 'Overview & Features' },
    dashboard: { title: 'Presentations', subtitle: 'Your library and practice studio' },
    presentations: { title: 'Presentation Library', subtitle: 'Manage slide decks & uploads' },
    presenter: { title: 'Presenter Mode', subtitle: 'Hands-free gesture control active' },
    rehearsal: { title: 'AI Rehearsal Coach', subtitle: 'Practice speech pace & delivery' },
    calibration: { title: 'Camera & Gesture Setup', subtitle: 'Check camera angle and sensitivity' },
    trainer: { title: 'Custom Gesture Trainer', subtitle: 'Teach slideX a custom move' },
    analytics: { title: 'Session Analytics', subtitle: 'Review pace & presentation history' },
    docs: { title: 'Help & Viva Preparation', subtitle: 'Demo guide and committee questions' },
    settings: { title: 'Preferences', subtitle: 'Customize hand gestures and options' },
  };

  const currentMeta = viewTitles[currentView] || { title: 'Workspace', subtitle: 'slideX' };

  return (
    <header className="flex h-14 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-6 select-none shrink-0 z-20">
      {/* Friendly Breadcrumbs & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-2 text-xs hover:opacity-80 transition-opacity"
        >
          <span className="text-muted-foreground font-medium">slideX</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-semibold text-foreground tracking-tight">{currentMeta.title}</span>
        </button>
        <span className="hidden lg:inline text-xs text-muted-foreground/50">•</span>
        <span className="hidden lg:inline text-xs text-muted-foreground truncate">{currentMeta.subtitle}</span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search or commands...</span>
          <kbd className="pointer-events-none hidden h-4 select-none items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium sm:flex">
            <span>⌘</span>K
          </kbd>
        </button>

        {/* Faculty / Examiner Demo Telemetry Toggle */}
        <Button
          variant={showPerformanceHud ? 'secondary' : 'ghost'}
          size="sm"
          onClick={togglePerformanceHud}
          className={cn(
            'h-8 gap-1.5 text-xs font-medium',
            showPerformanceHud && 'bg-primary/10 text-primary border border-primary/30'
          )}
          title="Toggle examiner performance HUD (FPS, latency & model confidence)"
        >
          <Activity className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Demo HUD</span>
        </Button>

        {/* Quick Presenter Launch Button */}
        {currentView !== 'presenter' && (
          <Button
            size="sm"
            onClick={() => setCurrentView('presenter')}
            className="h-8 gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Start Presenting</span>
          </Button>
        )}

        {/* Theme Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
          title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </header>
  );
}
