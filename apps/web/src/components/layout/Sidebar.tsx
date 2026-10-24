import { 
  Presentation, 
  PlaySquare, 
  Mic2, 
  SlidersHorizontal, 
  Hand, 
  BarChart3, 
  BookOpen, 
  Settings, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Sparkles,
  Camera
} from 'lucide-react';
import { useAppStore, type AppView } from '@/stores/appStore';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const { currentView, setCurrentView, sidebarOpen, toggleSidebar, gestureState } = useAppStore();

  const navItems: { id: AppView; label: string; icon: React.ElementType; section?: string; badge?: string }[] = [
    { id: 'dashboard', label: 'My Presentations', icon: Presentation, section: 'Present' },
    { id: 'presenter', label: 'Presenter Mode', icon: PlaySquare, badge: 'Live' },
    { id: 'rehearsal', label: 'AI Practice Coach', icon: Mic2, badge: 'Pacing' },
    { id: 'calibration', label: 'Camera & Gestures', icon: SlidersHorizontal, section: 'Tools' },
    { id: 'trainer', label: 'Custom Gestures', icon: Hand },
    { id: 'analytics', label: 'Practice Insights', icon: BarChart3 },
    { id: 'docs', label: 'Viva & Demo Guide', icon: BookOpen, section: 'Project' },
    { id: 'settings', label: 'Preferences', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-border bg-card transition-all duration-200 select-none z-30 shrink-0',
        sidebarOpen ? 'w-60' : 'w-16'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2.5 text-left group overflow-hidden"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold shadow-sm shrink-0">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm tracking-tight text-foreground flex items-center gap-1.5">
                GestureDeck
              </span>
              <span className="text-[11px] text-muted-foreground truncate">Touchless Presentations</span>
            </div>
          )}
        </button>

        <button
          onClick={toggleSidebar}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <div key={item.id}>
              {item.section && sidebarOpen && (
                <div className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => setCurrentView(item.id)}
                title={!sidebarOpen ? item.label : undefined}
                className={cn(
                  'group flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors text-left relative',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {sidebarOpen && (
                  <span className="truncate flex-1">{item.label}</span>
                )}
                {sidebarOpen && item.badge && (
                  <span
                    className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                      isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Friendly Bottom Status Box */}
      <div className="border-t border-border p-3 space-y-2">
        {sidebarOpen ? (
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Gesture Engine
              </span>
              <Badge variant="outline" className="text-[9px] font-mono capitalize">
                {gestureState}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Webcam recognizes gestures locally on your device.
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
              <ShieldCheck className="h-3 w-3" />
              <span>100% Private • On-Device</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Gesture Engine: Active & Private">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
