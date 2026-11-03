/* ============================================
   EXERCISE COMPLETED SCREEN — Apple visionOS Style
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button } from '@/components/ui';
import { formatWeight, formatDuration } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { WorkoutExerciseLog } from '@/types';

interface ExerciseCompletedProps {
  exerciseLog: WorkoutExerciseLog;
  onContinue: () => void;
  onAddExtraSet?: () => void;
}

export const ExerciseCompletedScreen: React.FC<ExerciseCompletedProps> = ({
  exerciseLog,
  onContinue,
  onAddExtraSet,
}) => {
  const isCardio = exerciseLog.exerciseTypeSnapshot === 'cardio';
  const cardioSeconds = exerciseLog.setLogs[0]?.durationSeconds ?? 0;

  return (
    <AppShell showNav={false}>
      <div className="flex-1 flex flex-col items-start justify-center px-4 pb-[calc(32px+env(safe-area-inset-bottom))]">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 18, stiffness: 220, delay: 0.1 }}
          className="w-16 h-16 rounded-3xl bg-white/[0.08] border border-white/[0.14] flex items-center justify-center mb-6"
        >
          <Check className="w-8 h-8 text-white stroke-[2.5]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 w-full"
        >
          <h2 className="text-display font-semibold text-text-primary leading-tight">
            {exerciseLog.exerciseNameSnapshot}
            <br />
            Completato
          </h2>
          <p className="text-body text-text-secondary mt-2 font-normal">
            {isCardio
              ? strings.exercise.cardioDone
              : `${exerciseLog.setLogs.length} serie completate`}
          </p>
        </motion.div>

        {/* Sets Summary */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full mb-8 glass-panel rounded-card p-4 space-y-2"
        >
          {isCardio ? (
            <p className="text-[20px] font-semibold text-text-primary tabular-nums">
              {formatDuration(cardioSeconds * 1000)}
            </p>
          ) : (
            exerciseLog.setLogs.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between py-1 text-meta">
                <span className="text-text-secondary font-normal">
                  Serie {i + 1}
                </span>
                <span className="font-semibold text-text-primary tabular-nums">
                  {formatWeight(s.weight)} × {s.reps} rip
                </span>
              </div>
            ))
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full mt-auto space-y-4"
        >
          {!isCardio && onAddExtraSet && (
            <Button variant="secondary" fullWidth onClick={onAddExtraSet}>
              + Serie extra / Drop set
            </Button>
          )}
          <Button variant="primary" fullWidth onClick={onContinue}>
            {strings.workout.continueCta}
          </Button>
        </motion.div>
      </div>
    </AppShell>
  );
};
