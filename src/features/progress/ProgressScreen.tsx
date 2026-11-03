/* ============================================
   PROGRESS SCREEN
   Metrics, trends, exercise history overview
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { MetricCard, EmptyState, SectionHeader } from '@/components/ui';
import { workoutRepo, programRepo } from '@/db/repositories';
import {
  getWorkoutMetrics,
  getExercisePerformances,
  getExerciseTrend,
  detectExerciseStall,
} from '@/lib/selectors';
import { formatDuration, formatWeight } from '@/lib/formatters';
import { useTabSync } from '@/lib/tabSync';
import { strings } from '@/lib/strings';
import type { Workout, Program } from '@/types';

export const ProgressScreen: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [all, prog] = await Promise.all([
      workoutRepo.getAll(),
      programRepo.getActive(),
    ]);
    setWorkouts(all);
    setProgram(prog ?? null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useTabSync(() => {
    void loadData();
  });

  const completed = workouts.filter((w) => w.status === 'completed');
  const metrics = getWorkoutMetrics(completed);

  const strengthExercises =
    program?.sessions
      .flatMap((s) => s.exercises)
      .filter((e) => e.type === 'strength')
      .filter(
        (e, i, arr) => arr.findIndex((x) => x.name === e.name) === i
      ) ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <ScreenHeader title={strings.progress.title} variant="display" titleSize="xl" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (completed.length === 0) {
    return (
      <AppShell>
        <ScreenHeader title={strings.progress.title} variant="display" titleSize="xl" />
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title={strings.progress.noDataTitle}
            description={strings.progress.noData}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <ScreenHeader title={strings.progress.title} variant="display" titleSize="xl" />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-4 space-y-4">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard
              label={strings.progress.totalWorkouts}
              value={String(metrics.totalCompleted)}
            />
            <MetricCard
              label={strings.progress.streak}
              value={`${metrics.currentStreak}`}
              sub="giorni consecutivi"
            />
            <MetricCard
              label={strings.progress.thisWeek}
              value={String(metrics.thisWeekCount)}
              sub="questa settimana"
            />
            <MetricCard
              label={strings.progress.avgDuration}
              value={
                metrics.averageDurationMs > 0
                  ? formatDuration(metrics.averageDurationMs)
                  : '—'
              }
            />
          </div>

          {/* Exercise Trends */}
          {strengthExercises.length > 0 && (
            <div className="pt-2">
              <SectionHeader title={strings.progress.exerciseTrends} />
              <div className="space-y-2">
                {strengthExercises.map((ex) => {
                  const perfs = getExercisePerformances(completed, ex.id);
                  const trend = getExerciseTrend(perfs);
                  const latest = perfs[perfs.length - 1];
                  const stall = detectExerciseStall(perfs);

                  return (
                    <motion.button
                      key={ex.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      onClick={() => navigate(`/progress/exercise/${ex.id}`)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.04] text-left hover:border-white/20 hover:bg-white/[0.06] backdrop-blur-xl transition-all"
                    >
                      {/* Trend icon */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          trend === 'up'
                            ? 'bg-white/10 text-white'
                            : trend === 'down'
                            ? 'bg-danger/10 text-danger'
                            : 'bg-white/5 text-text-secondary'
                        }`}
                      >
                        {trend === 'up' ? (
                          <TrendingUp className="w-4 h-4" strokeWidth={1.75} />
                        ) : trend === 'down' ? (
                          <TrendingDown className="w-4 h-4" strokeWidth={1.75} />
                        ) : (
                          <Minus className="w-4 h-4" strokeWidth={1.75} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-semibold text-text-primary">
                            {ex.name}
                          </p>
                          {stall?.isStalled && (
                            <span className="text-[11px] font-semibold text-warning px-2 py-0.5 rounded-full bg-warning/10 border border-warning/20">
                              Stallo
                            </span>
                          )}
                        </div>
                        <p className="text-meta text-text-secondary mt-1">
                          {latest
                            ? formatWeight(latest.representativeWeight)
                            : strings.progress.noDataShort}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-text-secondary" strokeWidth={1.75} />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
