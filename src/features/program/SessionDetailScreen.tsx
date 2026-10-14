/* ============================================
   SESSION DETAIL SCREEN
   Exercise list for one session + start action.
   Split out of ProgramScreen so the route lazy-
   loads its own chunk.
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Pencil } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button } from '@/components/ui';
import { programRepo } from '@/db/repositories';
import { useWorkoutStore } from '@/stores/workoutStore';
import { strings } from '@/lib/strings';
import type { SessionTemplate } from '@/types';

export const SessionDetailScreen: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionTemplate | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const prog = await programRepo.getFirst();
      if (!prog || !sessionId) return;
      setProgramId(prog.id);
      const s = prog.sessions.find((s) => s.id === sessionId);
      setSession(s ?? null);
    };
    void load();
  }, [sessionId]);

  if (!session) {
    return (
      <AppShell>
        <ScreenHeader title={strings.sessionDetail.title} showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  const sortedExercises = [...session.exercises].sort((a, b) => a.order - b.order);

  const handleStartWorkout = async () => {
    if (!programId || !session) return;
    const workout = await useWorkoutStore.getState().startWorkout(programId, {
      id: session.id,
      name: session.name,
      exercises: session.exercises,
    });
    navigate(`/workout/${workout.id}`);
  };

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={session.name.toUpperCase()}
        showBack
        rightAction={
          <button
            onClick={() => navigate(`/program/session/${sessionId}/edit`)}
            aria-label={strings.sessionDetail.editLabel}
            className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-text-primary"
          >
            <Pencil className="w-5 h-5" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-[calc(100px+env(safe-area-inset-bottom))]">
        <div className="px-5 pt-4 space-y-2">
          {sortedExercises.map((ex, i) => (
            <motion.button
              key={ex.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() =>
                navigate(`/exercise/${ex.id}/edit`, {
                  state: { programId, sessionId },
                })
              }
              className="w-full flex items-center gap-4 p-4 rounded-card border border-border-default bg-bg-surface text-left hover:border-text-secondary/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-bg-elevated flex items-center justify-center text-meta text-text-secondary font-semibold">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-semibold text-text-primary">{ex.name}</p>
                <p className="text-meta text-text-secondary mt-0.5">
                  {ex.type === 'cardio'
                    ? strings.sessionDetail.cardio
                    : strings.sessionDetail.setLine(ex.sets, ex.targetReps, ex.defaultWeight)}
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Start Workout Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-5 bg-gradient-to-t from-bg-app via-bg-app/95 to-transparent pb-[calc(20px+env(safe-area-inset-bottom))] z-20">
        <Button variant="primary" fullWidth onClick={handleStartWorkout}>
          {strings.sessionDetail.startCta}
        </Button>
      </div>
    </AppShell>
  );
};
