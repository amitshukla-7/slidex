import * as React from 'react';
import { 
  Search, 
  LayoutDashboard, 
  Presentation, 
  PlaySquare, 
  Mic2, 
  SlidersHorizontal, 
  Hand, 
  BarChart3, 
  BookOpen, 
  Settings, 
  Sun, 
  Moon, 
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAppStore, type AppView } from '@/stores/appStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

export function CommandPalette() {
  const { 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    setCurrentView,
    togglePerformanceHud,
    showPerformanceHud
  } = useAppStore();
  
  const { toggleTheme, resolvedTheme } = useThemeStore();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Global shortcut Cmd+K or Ctrl+K
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  React.useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
      setQuery('');
    }
  }, [commandPaletteOpen]);

  const commands = [
    {
      id: 'dash',
      label: 'Go to Dashboard',
      category: 'Navigation',
      icon: LayoutDashboard,
      action: () => setCurrentView('dashboard'),
    },
    {
      id: 'library',
      label: 'Open Presentation Library',
      category: 'Navigation',
      icon: Presentation,
      action: () => setCurrentView('presentations'),
    },
    {
      id: 'present',
      label: 'Launch Presenter Mode',
      category: 'Action',
      icon: PlaySquare,
      action: () => setCurrentView('presenter'),
    },
    {
      id: 'rehearse',
      label: 'Start AI Rehearsal Coach',
      category: 'Action',
      icon: Mic2,
      action: () => setCurrentView('rehearsal'),
    },
    {
      id: 'calibrate',
      label: 'Calibrate Vision & Hand Distance',
      category: 'Vision Engine',
      icon: SlidersHorizontal,
      action: () => setCurrentView('calibration'),
    },
    {
      id: 'train',
      label: 'Record & Train Custom Gesture',
      category: 'Vision Engine',
      icon: Hand,
      action: () => setCurrentView('trainer'),
    },
    {
      id: 'analytics',
      label: 'View Session Analytics',
      category: 'Data',
      icon: BarChart3,
      action: () => setCurrentView('analytics'),
    },
    {
      id: 'theme',
      label: `Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Theme`,
      category: 'Preferences',
      icon: resolvedTheme === 'dark' ? Sun : Moon,
      action: () => toggleTheme(),
    },
    {
      id: 'hud',
      label: `${showPerformanceHud ? 'Hide' : 'Show'} Real-time Performance HUD`,
      category: 'Preferences',
      icon: Activity,
      action: () => togglePerformanceHud(),
    },
    {
      id: 'viva',
      label: 'Open Documentation & Faculty Viva Bank',
      category: 'Docs',
      icon: BookOpen,
      action: () => setCurrentView('docs'),
    },
  ];

  const filteredCommands = commands.filter(cmd =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-150">
      <div 
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search destination..."
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <kbd className="h-5 select-none rounded border border-border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No matching commands found.
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    setCommandPaletteOpen(false);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs text-left transition-colors',
                    isSelected ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', isSelected ? 'text-primary' : 'text-muted-foreground')} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground/70">
                      {item.category}
                    </span>
                    {isSelected && <ArrowRight className="h-3 w-3 text-primary" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Palette Footer */}
        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono">↵</kbd> Select</span>
          </div>
          <span className="font-mono text-[10px]">GestureDeck Quick Dispatch</span>
        </div>
      </div>
    </div>
  );
}
