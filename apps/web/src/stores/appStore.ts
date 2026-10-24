import { create } from 'zustand';

export type AppView = 
  | 'landing'
  | 'dashboard'
  | 'presentations'
  | 'presenter'
  | 'editor'
  | 'rehearsal'
  | 'calibration'
  | 'trainer'
  | 'analytics'
  | 'settings'
  | 'docs';

export type GestureState = 'idle' | 'armed' | 'paused' | 'executing';

export interface PerformanceStats {
  fps: number;
  latencyMs: number;
  confidence: number;
  activeHand: 'Left' | 'Right' | 'None';
  workerLatencyMs: number;
}

interface AppStore {
  // Navigation
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Performance HUD
  showPerformanceHud: boolean;
  setShowPerformanceHud: (show: boolean) => void;
  togglePerformanceHud: () => void;

  // Active Presentation
  activePresentationId: string | null;
  setActivePresentationId: (id: string | null) => void;

  // Vision & Gesture live status
  gestureState: GestureState;
  setGestureState: (state: GestureState) => void;
  currentGesture: string;
  setCurrentGesture: (gesture: string) => void;
  performance: PerformanceStats;
  setPerformance: (stats: Partial<PerformanceStats>) => void;

  // User Settings
  dominantHand: 'right' | 'left';
  setDominantHand: (hand: 'right' | 'left') => void;
  gestureSensitivity: number; // 0.1 to 1.0
  setGestureSensitivity: (sensitivity: number) => void;
  soundFeedback: boolean;
  setSoundFeedback: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'dashboard',
  setCurrentView: (view) => set({ currentView: view }),
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  showPerformanceHud: false,
  setShowPerformanceHud: (show) => set({ showPerformanceHud: show }),
  togglePerformanceHud: () => set((state) => ({ showPerformanceHud: !state.showPerformanceHud })),

  activePresentationId: 'deck-1',
  setActivePresentationId: (id) => set({ activePresentationId: id }),

  gestureState: 'idle',
  setGestureState: (state) => set({ gestureState: state }),
  currentGesture: 'None',
  setCurrentGesture: (gesture) => set({ currentGesture: gesture }),
  performance: {
    fps: 32,
    latencyMs: 24,
    confidence: 0.94,
    activeHand: 'Right',
    workerLatencyMs: 12,
  },
  setPerformance: (stats) =>
    set((state) => ({
      performance: { ...state.performance, ...stats },
    })),

  dominantHand: 'right',
  setDominantHand: (hand) => set({ dominantHand: hand }),
  gestureSensitivity: 0.75,
  setGestureSensitivity: (sensitivity) => set({ gestureSensitivity: sensitivity }),
  soundFeedback: true,
  setSoundFeedback: (enabled) => set({ soundFeedback: enabled }),
  highContrast: false,
  setHighContrast: (enabled) => set({ highContrast: enabled }),
}));
