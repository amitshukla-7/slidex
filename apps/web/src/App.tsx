import * as React from 'react';
import { useAppStore } from '@/stores/appStore';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { LandingView } from '@/components/landing/LandingView';
import { DocsView } from '@/components/docs/DocsView';
import { SettingsView } from '@/components/settings/SettingsView';
import { CalibrationView } from '@/components/calibration/CalibrationView';
import { PresenterMode } from '@/components/presenter/PresenterMode';
import { SlideEditorView } from '@/components/editor/SlideEditorView';
import { GestureTrainerView } from '@/components/trainer/GestureTrainerView';
import { RehearsalCoachView } from '@/components/rehearsal/RehearsalCoachView';
import { AnalyticsView } from '@/components/analytics/AnalyticsView';

export function App() {
  const { currentView } = useAppStore();

  const renderView = () => {
    switch (currentView) {
      case 'presenter':
        return <PresenterMode />;
      case 'editor':
        return <SlideEditorView />;
      case 'trainer':
        return <GestureTrainerView />;
      case 'rehearsal':
        return <RehearsalCoachView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'landing':
        return <LandingView />;
      case 'dashboard':
        return <DashboardView />;
      case 'calibration':
        return <CalibrationView />;
      case 'docs':
        return <DocsView />;
      case 'settings':
        return <SettingsView />;
      case 'presentations':
        return <DashboardView />;
      default:
        return <DashboardView />;
    }
  };

  return <AppLayout>{renderView()}</AppLayout>;
}

export default App;
