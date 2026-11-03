/* ============================================
   EXERCISE HISTORY SCREEN
   Per-exercise weight chart + set history.
   Apple visionOS Glass Design System (No AI slop)
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
import { EmptyState, SectionHeader, GlassCard } from '@/components/ui';
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
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={exerciseName || 'Esercizio'}
        showBack
      />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-4 space-y-4">
          {/* Latest performance */}
          {latestPerf && (
            <GlassCard className="p-4">
              <p className="text-label-sm text-text-secondary mb-1">
                {strings.exerciseHistory.last}
              </p>
              <p className="text-[32px] font-semibold text-text-primary tracking-tight">
                {formatWeight(latestPerf.representativeWeight)}
              </p>
              <p className="text-meta text-text-secondary mt-1">
                {latestPerf.sets.length} serie ·{' '}
                {latestPerf.sets[0]?.reps} rep
              </p>
            </GlassCard>
          )}

          {/* Stall warning */}
          {stall?.isStalled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-warning/10 border border-warning/25 rounded-2xl p-4 backdrop-blur-xl"
            >
              <p className="text-label-sm text-warning mb-1 font-semibold">
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
            <GlassCard className="p-4">
              <p className="text-label-sm text-text-secondary mb-4 font-semibold">
                {strings.exerciseHistory.chart}
              </p>
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
                  <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 4, left: -20 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255, 255, 255, 0.08)"
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
                        background: 'rgba(28, 28, 30, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 12,
                        backdropFilter: 'blur(20px)',
                        color: '#FFFFFF',
                        fontSize: 13,
                      }}
                      formatter={(value: number) => [formatWeight(value), 'Peso']}
                      labelStyle={{ color: '#8E8E93' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                      dot={{ fill: '#FFFFFF', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: '#FFFFFF', stroke: '#000000', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          ) : chartData.length === 1 ? (
            <GlassCard className="p-4 text-center">
              <p className="text-meta text-text-secondary">
                {strings.exerciseHistory.chartEmpty}
              </p>
            </GlassCard>
          ) : (
            <EmptyState
              title={strings.exerciseHistory.noData}
              description={strings.exerciseHistory.chartEmptyHint}
            />
          )}

          {/* Historical entries */}
          {perfs.length > 0 && (
            <div className="pt-2">
              <SectionHeader title={strings.exerciseHistory.sectionTitle} />
              <div className="space-y-4">
                {[...perfs].reverse().map((perf) => (
                  <GlassCard
                    key={perf.workoutDate}
                    className="p-4"
                  >
                    <p className="text-meta text-text-secondary mb-2">
                      {formatDateShort(perf.workoutDate)}
                    </p>
                    <div className="space-y-1.5">
                      {perf.sets.map((s, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span className="text-meta text-text-secondary">
                            Serie {i + 1}
                          </span>
                          <span className="text-meta text-text-primary font-semibold tabular-nums">
                            {formatWeight(s.weight)} × {s.reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
