/* ============================================
   SESSION DETAIL SCREEN
   Exercise list for one session + start action.
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Pencil } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, IconButton } from '@/components/ui';
import { programRepo } from '@/db/repositories';
import { useWorkoutStore } from '@/stores/workoutStore';
import { strings } from '@/lib/strings';
import type { SessionTemplate } from '@/types';

export const SessionDetailScreen: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionTemplate | null>(null);
  const [programId, setProgramId] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const prog = (await programRepo.getActive()) ?? (await programRepo.getFirst());
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
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  const sortedExercises = [...session.exercises].sort((a, b) => a.order - b.order);

  const handleStartWorkout = async () => {
    if (!programId || !session || isStarting) return;
    setIsStarting(true);
    try {
      const workout = await useWorkoutStore.getState().startWorkout(programId, {
        id: session.id,
        name: session.name,
        exercises: session.exercises,
      });
      navigate(`/workout/${workout.id}`);
    } catch (e) {
      console.error('Failed to start workout:', e);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={session.name}
        showBack
        rightAction={
          <IconButton
            label={strings.sessionDetail.editLabel}
            onClick={() => navigate(`/program/session/${sessionId}/edit`)}
          >
            <Pencil className="w-5 h-5" strokeWidth={1.75} />
          </IconButton>
        }
      />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 space-y-2">
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
              className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-left hover:border-white/20 hover:bg-white/[0.06] backdrop-blur-xl transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-meta text-text-secondary font-semibold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-text-primary">{ex.name}</p>
                <p className="text-meta text-text-secondary mt-1">
                  {ex.type === 'cardio'
                    ? strings.sessionDetail.cardio
                    : strings.sessionDetail.setLine(ex.sets, ex.targetReps, ex.defaultWeight)}
                </p>
                {ex.notes && (
                  <p className="text-meta text-text-secondary/70 mt-1 whitespace-pre-line line-clamp-2">
                    {ex.notes}
                  </p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-text-secondary" strokeWidth={1.75} />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Start Workout Action Bar — VisionOS frosted glass bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 pb-8 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-20">
        <Button variant="primary" fullWidth isLoading={isStarting} onClick={handleStartWorkout}>
          {strings.sessionDetail.startCta}
        </Button>
      </div>
    </AppShell>
  );
};
