/* ============================================
   EXERCISE COMPLETED SCREEN
   Post-set celebration: check, summary of the
   logged sets, continue CTA.
   Split out of ExerciseFocusScreen so the focus
   screen keeps to one responsibility.
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button } from '@/components/ui';
import { formatWeight } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { WorkoutExerciseLog } from '@/types';

interface ExerciseCompletedProps {
  exerciseLog: WorkoutExerciseLog;
  onContinue: () => void;
}

export const ExerciseCompletedScreen: React.FC<ExerciseCompletedProps> = ({
  exerciseLog,
  onContinue,
}) => (
  <AppShell showNav={false}>
    <div className="flex-1 flex flex-col items-start justify-center px-5 pb-[calc(40px+env(safe-area-inset-bottom))]">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
        className="mb-4"
      >
        <Check className="w-16 h-16 text-accent-primary" strokeWidth={2} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-6 w-full"
      >
        <h2 className="screen-title text-[28px] leading-[38px] tracking-[-0.42px] uppercase">
          {exerciseLog.exerciseNameSnapshot.toUpperCase()}
          <br />
          COMPLETATA
        </h2>
        <p className="text-body text-text-secondary mt-3">
          {exerciseLog.setLogs.length} serie completate
        </p>
      </motion.div>

      {/* Sets summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="w-full mb-8"
      >
        {exerciseLog.setLogs.map((s, i) => (
          <div key={s.id} className="py-1">
            <span className="text-[20px] font-semibold text-text-primary">
              {String(i + 1).padStart(2, '0')}
              {'   '}
              {formatWeight(s.weight)} × {s.reps}
            </span>
          </div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full mt-auto"
      >
        <Button variant="primary" fullWidth onClick={onContinue}>
          {strings.workout.continueCta}
        </Button>
      </motion.div>
    </div>
  </AppShell>
);
