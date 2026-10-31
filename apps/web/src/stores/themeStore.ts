import { create } from 'zustand';

export type Theme = 'dark' | 'light' | 'system';

interface ThemeStore {
  theme: Theme;
  resolvedTheme: 'dark' | 'light';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = (localStorage.getItem('slidex-theme') || localStorage.getItem('gesturedeck-theme')) as Theme;
    if (saved && ['dark', 'light', 'system'].includes(saved)) {
      return saved;
    }
  }
  return 'dark';
};

export const useThemeStore = create<ThemeStore>((set, get) => {
  const initialTheme = getInitialTheme();
  const initialResolved = initialTheme === 'system' ? getSystemTheme() : initialTheme;

  // Apply to document
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(initialResolved);
  }

  return {
    theme: initialTheme,
    resolvedTheme: initialResolved,
    setTheme: (newTheme: Theme) => {
      const resolved = newTheme === 'system' ? getSystemTheme() : newTheme;
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(resolved);
        localStorage.setItem('slidex-theme', newTheme);
      }
      set({ theme: newTheme, resolvedTheme: resolved });
    },
    toggleTheme: () => {
      const current = get().resolvedTheme;
      const next = current === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});
