/* ============================================
   EXERCISE HISTORY SCREEN
   Per-exercise weight chart + set history.
   Split out of ProgressScreen so recharts only
   loads in this route's chunk, not the parent's.
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { AppShell, ScreenHeader } from '@/components/layout';
import { EmptyState, SectionHeader } from '@/components/ui';
import { workoutRepo, programRepo } from '@/db/repositories';
import { getExercisePerformances, detectExerciseStall } from '@/lib/selectors';
import { formatDateShort, formatWeight } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { Workout } from '@/types';

export const ExerciseHistoryScreen: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exerciseName, setExerciseName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const [all, prog] = await Promise.all([
        workoutRepo.getAll(),
        programRepo.getFirst(),
      ]);
      setWorkouts(all);

      // Get exercise name from program
      if (prog && exerciseId) {
        const ex = prog.sessions
          .flatMap((s) => s.exercises)
          .find((e) => e.id === exerciseId);
        if (ex) setExerciseName(ex.name);
      }
      setIsLoading(false);
    };
    void load();
  }, [exerciseId]);

  const completed = workouts.filter((w) => w.status === 'completed');
  const perfs = exerciseId ? getExercisePerformances(completed, exerciseId) : [];
  const stall = detectExerciseStall(perfs);

  const chartData = perfs.map((p) => ({
    date: formatDateShort(p.workoutDate),
    weight: p.representativeWeight,
    timestamp: p.workoutDate,
  }));

  const latestPerf = perfs[perfs.length - 1];

  if (isLoading) {
    return (
      <AppShell showNav={false}>
        <ScreenHeader title={strings.exerciseHistory.sectionTitle} showBack />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={exerciseName.toUpperCase() || 'ESERCIZIO'}
        showBack
      />

      <div className="flex-1 overflow-y-auto pb-[calc(40px+env(safe-area-inset-bottom))]">
        <div className="px-5 pt-4 space-y-5">
          {/* Latest performance */}
          {latestPerf && (
            <div className="bg-bg-surface rounded-card border border-border-default p-5">
              <p className="text-label-sm text-text-secondary mb-1">
                {strings.exerciseHistory.last}
              </p>
              <p className="text-[32px] font-bold text-text-primary">
                {formatWeight(latestPerf.representativeWeight)}
              </p>
              <p className="text-meta text-text-secondary mt-1">
                {latestPerf.sets.length} serie ·{' '}
                {latestPerf.sets[0]?.reps} rep
              </p>
            </div>
          )}

          {/* Stall warning */}
          {stall?.isStalled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-warning/10 border border-warning/30 rounded-card p-4"
            >
              <p className="text-label-sm text-warning mb-1">
                {strings.progress.stall}
              </p>
              <p className="text-meta text-text-primary">
                {strings.progress.stallDetail(
                  formatWeight(stall.currentWeight),
                  stall.daysSinceIncrease
                )}
              </p>
            </motion.div>
          )}

          {/* Weight chart */}
          {chartData.length > 1 ? (
            <div className="bg-bg-surface rounded-card border border-border-default p-5">
              <p className="text-label-sm text-text-secondary mb-4">
                {strings.exerciseHistory.chart}
              </p>
              {/* Recharts SVGs are not announced by screen readers; describe
                  the trend in text so the data is still conveyed. */}
              <div
                role="img"
                aria-label={`${exerciseName || 'Esercizio'}: andamento del peso da ${formatWeight(
                  chartData[0].weight
                )} a ${formatWeight(chartData[chartData.length - 1].weight)} su ${
                  chartData.length
                } allenamenti, dal ${chartData[0].date} al ${
                  chartData[chartData.length - 1].date
                }.`}
              >
                <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#2C2C2E"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8E8E93', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#8E8E93', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1C1C1E',
                      border: '1px solid #2C2C2E',
                      borderRadius: 10,
                      color: '#F5F5F7',
                      fontSize: 13,
                    }}
                    formatter={(value: number) => [formatWeight(value), 'Peso']}
                    labelStyle={{ color: '#8E8E93' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#C8FF3D"
                    strokeWidth={2}
                    dot={{ fill: '#C8FF3D', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#C8FF3D' }}
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>
          ) : chartData.length === 1 ? (
            <div className="bg-bg-surface rounded-card border border-border-default p-5 text-center">
              <p className="text-meta text-text-secondary">
                {strings.exerciseHistory.chartEmpty}
              </p>
            </div>
          ) : (
            <EmptyState
              title={strings.exerciseHistory.noData}
              description={strings.exerciseHistory.chartEmptyHint}
            />
          )}

          {/* Historical entries */}
          {perfs.length > 0 && (
            <div>
              <SectionHeader title={strings.exerciseHistory.sectionTitle} />
              <div className="space-y-3">
                {[...perfs].reverse().map((perf) => (
                  <div
                    key={perf.workoutDate}
                    className="bg-bg-surface rounded-card border border-border-default p-4"
                  >
                    <p className="text-meta text-text-secondary mb-2">
                      {formatDateShort(perf.workoutDate)}
                    </p>
                    <div className="space-y-1">
                      {perf.sets.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="text-meta text-text-secondary">
                            Serie {i + 1}
                          </span>
                          <span className="text-meta text-text-primary font-semibold">
                            {formatWeight(s.weight)} × {s.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
