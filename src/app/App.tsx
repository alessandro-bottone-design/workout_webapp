/* ============================================
   APP — Root component
   DB init, seed, error boundary, Lenis smooth scroll
   ============================================ */

import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Lenis from 'lenis';
import { AppRouter } from './router';
import { seedDatabase } from '@/db/seed';
import { useTimerStore, unlockAudio } from '@/features/timer/timerStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import { syncAll } from '@/lib/sync';
import { strings } from '@/lib/strings';

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-bg-app px-4 text-center">
          <p className="text-heading text-text-primary mb-2">{strings.errors.unexpected}</p>
          <p className="text-meta text-text-secondary mb-6">
            {this.state.error?.message ?? 'Errore sconosciuto'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="min-h-[48px] px-6 inline-flex items-center justify-center rounded-btn bg-white text-black text-meta font-semibold"
          >
            Ricarica l'app
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AppInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { loadFromDB } = useTimerStore();
  const { loadActiveWorkout } = useWorkoutStore();

  useEffect(() => {
    // Lenis smooth momentum scrolling (Apple-grade fluid motion)
    let lenis: Lenis | null = null;
    let frameId: number | null = null;

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lenis = new Lenis({
        duration: 0.9,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      const raf = (time: number) => {
        lenis?.raf(time);
        frameId = requestAnimationFrame(raf);
      };
      frameId = requestAnimationFrame(raf);
    }

    const init = async () => {
      try {
        await seedDatabase();
        if (navigator.storage?.persist) {
          void navigator.storage.persist().catch(() => {});
        }
        await Promise.all([
          loadFromDB(),
          loadActiveWorkout(),
          useAuthStore.getState().initAuth(),
        ]);
        setReady(true);

        // If user is already authenticated on app launch, trigger cloud sync
        const currentUser = useAuthStore.getState().user;
        if (currentUser) {
          void syncAll(currentUser.id);
        }
      } catch (e) {
        console.error('Init error:', e);
        setError('Errore di inizializzazione del database.');
      }
    };
    void init();

    // Unlock audio on first interaction
    const unlock = () => {
      unlockAudio();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock, { passive: true });
    document.addEventListener('click', unlock);

    return () => {
      if (frameId != null) cancelAnimationFrame(frameId);
      lenis?.destroy();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, [loadFromDB, loadActiveWorkout]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-bg-app px-4 text-center">
        <p className="text-heading text-text-primary mb-2">Errore</p>
        <p className="text-meta text-text-secondary mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="min-h-[48px] px-6 inline-flex items-center justify-center rounded-btn bg-white text-black text-meta font-semibold"
        >
          Riprova
        </button>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-bg-app">
        <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export const App: React.FC = () => (
  <ErrorBoundary>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppInitializer>
          <AppRouter />
        </AppInitializer>
      </BrowserRouter>
    </MotionConfig>
  </ErrorBoundary>
);
