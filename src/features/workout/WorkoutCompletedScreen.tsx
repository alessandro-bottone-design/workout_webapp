/* ============================================
   WORKOUT COMPLETED SCREEN — visionOS Style
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button, GlassCard } from '@/components/ui';
import { workoutRepo } from '@/db/repositories';
import { getRepresentativeWeight } from '@/lib/selectors';
import { formatDuration, formatWeight } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import { useTimerStore } from '@/features/timer/timerStore';
import type { Workout } from '@/types';

export const WorkoutCompletedScreen: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const { stopTimer } = useTimerStore();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [prevWorkoutLogs, setPrevWorkoutLogs] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const load = async () => {
      if (!workoutId) return;
      const w = await workoutRepo.getById(workoutId);
      if (!w) return;
      setWorkout(w);

      const strengthIds = w.exerciseLogs
        .filter(
          (exLog) =>
            exLog.status === 'completed' && exLog.exerciseTypeSnapshot !== 'cardio'
        )
        .map((exLog) => exLog.exerciseTemplateId);

      const prevPerfMap = await workoutRepo.getPreviousPerformances(
        strengthIds,
        w.startedAt
      );

      const prevMap = new Map<string, number>();
      prevPerfMap.forEach((log, templateId) => {
        prevMap.set(templateId, getRepresentativeWeight(log));
      });
      setPrevWorkoutLogs(prevMap);
    };
    void load();
    void stopTimer();
  }, [workoutId, stopTimer]);

  const handleFinish = () => {
    navigate('/', { replace: true });
  };

  if (!workout) {
    return (
      <AppShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  const duration =
    workout.completedAt && workout.startedAt
      ? workout.completedAt - workout.startedAt
      : 0;

  const completedExLogs = workout.exerciseLogs.filter(
    (e) => e.status === 'completed'
  );
  const totalSets = completedExLogs.reduce(
    (sum, e) => sum + e.setLogs.length,
    0
  );

  const progressItems = completedExLogs
    .filter((e) => e.exerciseTypeSnapshot === 'strength' && e.setLogs.length > 0)
    .map((e) => {
      const current = getRepresentativeWeight(e);
      const prev = prevWorkoutLogs.get(e.exerciseTemplateId);
      return { name: e.exerciseNameSnapshot, current, prev };
    })
    .filter((p) => p.prev !== undefined && p.current !== p.prev)
    .slice(0, 4);

  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex flex-col items-start justify-center px-4 pb-[calc(32px+env(safe-area-inset-bottom))]">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.1 }}
          className="w-16 h-16 rounded-3xl bg-white/[0.08] border border-white/[0.14] flex items-center justify-center mb-6"
        >
          <Check className="w-8 h-8 text-white stroke-[2.5]" />
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 w-full"
        >
          <h1 className="text-display font-semibold text-text-primary leading-tight whitespace-pre-line">
            {strings.workoutComplete.title}
          </h1>
          <p className="text-meta text-text-secondary mt-2 font-normal">
            {formatDuration(duration)} · {completedExLogs.length} esercizi · {totalSets} serie
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="w-full mb-6"
        >
          <div className="grid grid-cols-3 gap-2 text-left">
            <GlassCard className="p-4">
              <p className="text-[22px] font-semibold text-text-primary tabular-nums">
                {formatDuration(duration)}
              </p>
              <p className="text-label-sm text-text-secondary mt-1 font-normal">Durata</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-[22px] font-semibold text-text-primary tabular-nums">
                {completedExLogs.length}
              </p>
              <p className="text-label-sm text-text-secondary mt-1 font-normal">Esercizi</p>
            </GlassCard>
            <GlassCard className="p-4">
              <p className="text-[22px] font-semibold text-text-primary tabular-nums">
                {totalSets}
              </p>
              <p className="text-label-sm text-text-secondary mt-1 font-normal">Serie</p>
            </GlassCard>
          </div>
        </motion.div>

        {/* Progress Deltas */}
        {progressItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="w-full mb-8"
          >
            <GlassCard className="space-y-4 p-4">
              <p className="text-label-sm text-text-secondary font-semibold">
                {strings.workoutComplete.progress}
              </p>
              <div className="space-y-2">
                {progressItems.map((item) => {
                  const isUp = (item.current ?? 0) > (item.prev ?? 0);
                  return (
                    <div key={item.name} className="flex items-center justify-between text-meta">
                      <span className="text-text-primary font-normal">{item.name}</span>
                      <div className="flex items-center gap-1.5 tabular-nums">
                        <span className="text-text-secondary">
                          {formatWeight(item.prev!)}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-text-secondary inline" strokeWidth={1.75} />
                        <span
                          className={`font-semibold ${
                            isUp ? 'text-white' : 'text-danger'
                          }`}
                        >
                          {formatWeight(item.current)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full mt-auto"
        >
          <Button variant="primary" fullWidth onClick={handleFinish}>
            {strings.workoutComplete.end}
          </Button>
        </motion.div>
      </div>
    </AppShell>
  );
};
