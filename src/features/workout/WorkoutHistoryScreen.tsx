/* ============================================
   WORKOUT HISTORY SCREEN — visionOS Style
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Clock, Dumbbell } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { EmptyState, Button, GlassCard } from '@/components/ui';
import { workoutRepo } from '@/db/repositories';
import { formatDuration, formatDate } from '@/lib/formatters';
import { useTabSync } from '@/lib/tabSync';
import type { Workout } from '@/types';

export const WorkoutHistoryScreen: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkouts = async () => {
    setIsLoading(true);
    const completed = await workoutRepo.getCompleted();
    setWorkouts(completed);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadWorkouts();
  }, []);

  useTabSync(() => {
    void loadWorkouts();
  });

  if (isLoading) {
    return (
      <AppShell>
        <ScreenHeader title="Storico allenamenti" showBack onBack={() => navigate('/')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader
        title="Storico allenamenti"
        showBack
        onBack={() => navigate('/')}
      />

      <div className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom))]">
        <div className="px-4 pt-4 space-y-4">
          {workouts.length === 0 ? (
            <div className="py-16">
              <EmptyState
                title="Nessun allenamento completato"
                description="I tuoi workout salvati e lo storico degli esercizi appariranno qui dopo aver terminato il tuo primo allenamento."
                action={
                  <Button variant="secondary" onClick={() => navigate('/')}>
                    Torna alla Home
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-1 mb-2">
                <span className="text-label-sm text-text-secondary font-semibold">
                  Tutti i workout ({workouts.length})
                </span>
              </div>

              {workouts.map((w, idx) => {
                const durationMs = w.completedAt ? w.completedAt - w.startedAt : 0;
                const completedExCount = w.exerciseLogs.filter((e) => e.status === 'completed').length;
                const totalSetsCount = w.exerciseLogs.reduce(
                  (sum, e) => sum + e.setLogs.length,
                  0
                );

                return (
                  <motion.div
                    key={w.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <button
                      onClick={() => navigate(`/workout/${w.id}`)}
                      aria-label={`Visualizza allenamento ${w.sessionNameSnapshot} del ${formatDate(w.startedAt)}`}
                      className="w-full text-left"
                    >
                      <GlassCard className="hover:bg-white/[0.08] transition-colors">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            <span className="text-label-sm text-text-primary font-semibold">
                              {formatDate(w.startedAt)}
                            </span>
                            <h3 className="text-[16px] font-semibold text-text-primary mt-0.5">
                              {w.sessionNameSnapshot}
                            </h3>
                          </div>
                          <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0 mt-1" strokeWidth={1.75} />
                        </div>

                        <div className="flex items-center gap-4 text-meta text-text-secondary pt-2 border-t border-white/[0.06]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.75} />
                            <span>{durationMs > 0 ? formatDuration(durationMs) : '—'}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Dumbbell className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.75} />
                            <span>
                              {completedExCount} esercizi · {totalSetsCount} serie
                            </span>
                          </div>
                        </div>
                      </GlassCard>
                    </button>
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};
