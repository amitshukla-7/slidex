import * as React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';
import { PerformanceHud } from './PerformanceHud';
import { ToastContainer } from '@/components/ui/toast';
import { useAppStore } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { currentView } = useAppStore();
  const isFullScreenPresenter = currentView === 'presenter';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground">
      {/* Sidebar hidden during presenter mode for distraction-free delivery */}
      {!isFullScreenPresenter && <Sidebar />}

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {!isFullScreenPresenter && <Header />}

        <main className="flex-1 overflow-y-auto min-w-0 bg-background/50 relative">
          {children}
        </main>
      </div>

      <CommandPalette />
      <PerformanceHud />
      <ToastContainer />
    </div>
  );
}
