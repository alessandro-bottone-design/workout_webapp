/* ============================================
   HOME SCREEN — Apple visionOS Design System
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell, TrendingUp, Settings, Clock, Sparkles, Flame, Check } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button, ProgressBar, EmptyState, ScreenTitle, IconButton, GlassCard } from '@/components/ui';
import { programRepo, workoutRepo, settingsRepo } from '@/db/repositories';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getNextSessionId, getWorkoutMetrics } from '@/lib/selectors';
import { getRepresentativeWeight } from '@/lib/selectors';
import { getGymStatus, GYM_SCHEDULE } from '@/lib/gymSchedule';
import { useTabSync } from '@/lib/tabSync';
import {
  formatDuration,
  formatWeight,
} from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { Program, SessionTemplate, Workout } from '@/types';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const { activeWorkout, loadActiveWorkout } = useWorkoutStore();
  const [program, setProgram] = useState<Program | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<Workout[]>([]);
  const [recommendedSessionId, setRecommendedSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showFullGymHours, setShowFullGymHours] = useState(false);
  const [weeklyTarget, setWeeklyTarget] = useState(4);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Buongiorno' : hour < 17 ? 'Buon pomeriggio' : 'Buonasera';

  const gymStatus = getGymStatus();
  const todayDayOfWeek = new Date().getDay();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await loadActiveWorkout();
    const [prog, workouts, settings] = await Promise.all([
      programRepo.getActive(),
      workoutRepo.getCompleted(),
      settingsRepo.get(),
    ]);
    setProgram(prog ?? null);
    setCompletedWorkouts(workouts);
    setWeeklyTarget(settings.weeklyTarget ?? 4);

    if (prog && prog.sessions.length > 0) {
      const nextId = getNextSessionId(prog.sessions, workouts);
      const resolvedNextId = nextId ?? prog.sessions[0].id;
      setRecommendedSessionId(resolvedNextId);
      setSelectedSessionId((prev) => prev ?? resolvedNextId);
    }
    setIsLoading(false);
  }, [loadActiveWorkout]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useTabSync(() => {
    void loadData();
  });

  const lastWorkout = completedWorkouts[0];
  const metrics = getWorkoutMetrics(completedWorkouts);
  const weekTarget = weeklyTarget;

  const sortedSessions = program ? [...program.sessions].sort((a, b) => a.order - b.order) : [];

  const currentSession: SessionTemplate | null =
    (selectedSessionId && sortedSessions.find((s) => s.id === selectedSessionId)) ||
    (recommendedSessionId && sortedSessions.find((s) => s.id === recommendedSessionId)) ||
    sortedSessions[0] ||
    null;

  const isRecommended = currentSession?.id === recommendedSessionId;

  const handleStart = async () => {
    if (!program || !currentSession || isStarting) return;
    setIsStarting(true);
    try {
      const workout = await useWorkoutStore.getState().startWorkout(program.id, {
        id: currentSession.id,
        name: currentSession.name,
        exercises: currentSession.exercises,
      });
      navigate(`/workout/${workout.id}`);
    } catch (e) {
      console.error('Failed to start workout:', e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleResume = () => {
    if (!activeWorkout) return;
    navigate(`/workout/${activeWorkout.id}`);
  };

  const lastWorkoutProgress = React.useMemo(() => {
    if (!lastWorkout) return [];
    const strengthLogs = lastWorkout.exerciseLogs.filter(
      (e) => e.status === 'completed' && e.setLogs.length > 0
    );
    return strengthLogs.slice(0, 3).map((e) => ({
      name: e.exerciseNameSnapshot,
      weight: getRepresentativeWeight(e),
    }));
  }, [lastWorkout]);

  return (
    <AppShell>
      <div className="flex-1 pb-24">
        {/* Header Section */}
        <div className="px-4 pt-4 pb-2">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-meta text-text-secondary font-normal">
                {greeting}
              </p>
              <ScreenTitle size="lg" className="mt-1 font-semibold text-text-primary">
                Workout Lab
              </ScreenTitle>
            </div>
            <IconButton
              label={strings.home.settings}
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-5 h-5 text-text-secondary" strokeWidth={1.75} />
            </IconButton>
          </motion.div>
        </div>

        <div className="px-4 space-y-4 mt-2">
          {/* Resume Active Workout Banner */}
          {activeWorkout && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel bg-white/[0.08] border border-white/[0.16] rounded-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-label-sm text-text-secondary font-semibold mb-1">
                  Allenamento in corso
                </p>
                <p className="text-heading font-semibold text-text-primary">
                  {activeWorkout.sessionNameSnapshot}
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleResume}
              >
                Riprendi
              </Button>
            </motion.div>
          )}

          {/* Session Selector & Today's Workout Card */}
          {program && sortedSessions.length > 0 && !activeWorkout ? (
            <div className="space-y-2">
              {/* Session Selector Chips Header */}
              <div className="flex items-center justify-between px-1">
                <p className="text-label-sm text-text-secondary font-semibold">
                  Scegli la seduta
                </p>
                {isRecommended && (
                  <span className="text-[12px] font-semibold text-text-primary flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.75} /> Consigliata
                  </span>
                )}
              </div>

              {/* Segmented Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
                {sortedSessions.map((session) => {
                  const isSelected = session.id === currentSession?.id;
                  const isRec = session.id === recommendedSessionId;

                  return (
                    <motion.button
                      key={session.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`min-h-[48px] px-4 py-2 rounded-btn text-[14px] font-semibold transition-all whitespace-nowrap flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-white text-black border-white shadow-sm'
                          : 'bg-white/[0.05] text-text-secondary border-white/[0.08] hover:text-text-primary hover:bg-white/[0.08]'
                      }`}
                    >
                      <span>{session.name}</span>
                      {isRec && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            isSelected
                              ? 'bg-black/15 text-black'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          Auto
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Selected Session Details Card */}
              {currentSession && (
                <GlassCard className="mt-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-label-sm text-text-secondary font-semibold">
                      {isRecommended ? 'In programma oggi' : 'Seduta selezionata'}
                    </p>
                    <span className="text-meta text-text-secondary font-normal">
                      {currentSession.exercises.length} esercizi
                    </span>
                  </div>

                  <h2 className="text-title font-semibold text-text-primary leading-tight">
                    {currentSession.name}
                  </h2>

                  <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                    {currentSession.exercises.map((ex) => (
                      <div key={ex.id} className="flex items-center gap-2.5 text-left py-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40 flex-shrink-0" />
                        <span className="text-meta text-text-primary truncate font-normal">{ex.name}</span>
                        {ex.type === 'strength' && ex.sets ? (
                          <span className="text-meta text-text-secondary ml-auto whitespace-nowrap font-normal">
                            {ex.sets} × {ex.targetReps}
                            {ex.defaultWeight ? ` · ${ex.defaultWeight} kg` : ''}
                          </span>
                        ) : (
                          <span className="text-meta text-text-secondary ml-auto whitespace-nowrap font-normal">
                            {Math.round((ex.durationSeconds ?? 0) / 60)} min
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <Button variant="primary" fullWidth isLoading={isStarting} onClick={handleStart}>
                      {strings.home.startWorkout}
                    </Button>
                  </div>
                </GlassCard>
              )}
            </div>
          ) : !activeWorkout && !isLoading ? (
            <EmptyState
              icon={<Dumbbell className="w-8 h-8 text-text-secondary" strokeWidth={1.75} />}
              title={strings.home.noSessionTitle}
              description={strings.home.noProgram}
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate('/program')}>
                  {strings.program.goToProgram}
                </Button>
              }
            />
          ) : null}

          {/* Gym Hours Card */}
          <GlassCard>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-text-primary">
                  <Clock className="w-5 h-5 text-text-primary" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-label-sm text-text-secondary font-semibold">
                      Orari palestra
                    </p>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        gymStatus.isOpen
                          ? 'bg-success'
                          : 'bg-text-secondary opacity-40'
                      }`}
                    />
                  </div>
                  <h3 className="text-heading font-semibold text-text-primary mt-0.5">
                    {gymStatus.statusText}
                    <span className="text-meta text-text-secondary font-normal ml-2">
                      ({gymStatus.detailText})
                    </span>
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFullGymHours((v) => !v)}
                className="text-meta text-text-primary font-semibold hover:underline min-h-[48px] flex items-center px-2"
              >
                {showFullGymHours ? 'Chiudi' : 'Tutti gli orari'}
              </button>
            </div>

            <p className="text-meta text-text-secondary mt-2">
              {gymStatus.todayScheduleText}
            </p>

            <AnimatePresence>
              {showFullGymHours && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 pt-4 border-t border-white/[0.06] space-y-2 overflow-hidden"
                >
                  {GYM_SCHEDULE.map((item) => {
                    const isToday = item.days.includes(todayDayOfWeek);
                    return (
                      <div
                        key={item.dayLabel}
                        className={`flex items-center justify-between text-meta py-2 px-4 rounded-btn ${
                          isToday
                            ? 'bg-white/[0.08] text-white font-semibold'
                            : 'text-text-secondary'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {item.dayLabel}
                          {isToday && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-black font-semibold">
                              Oggi
                            </span>
                          )}
                        </span>
                        <span className={isToday ? 'text-white' : 'text-text-primary'}>
                          {item.hoursFormatted}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Last Workout */}
          {lastWorkout ? (
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <p className="text-label-sm text-text-secondary font-semibold">
                  {strings.home.lastWorkout}
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/history')}
                  className="min-h-[48px] -my-2 px-2 flex items-center text-label-sm text-text-primary font-semibold hover:underline"
                >
                  Vedi tutti ({completedWorkouts.length})
                </button>
              </div>
              <button
                className="w-full text-left"
                onClick={() => navigate(`/workout/${lastWorkout.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-heading font-semibold text-text-primary">
                      {lastWorkout.sessionNameSnapshot}
                    </h3>
                    <p className="text-meta text-text-secondary mt-0.5 font-normal">
                      {lastWorkout.completedAt
                        ? formatDuration(lastWorkout.completedAt - lastWorkout.startedAt)
                        : '—'}
                      {' · '}
                      {lastWorkout.exerciseLogs.filter((e) => e.status === 'completed').length} esercizi
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary mt-0.5" strokeWidth={1.75} />
                </div>

                {lastWorkoutProgress.length > 0 && (
                  <div className="mt-4 space-y-2 pt-2 border-t border-white/[0.06]">
                    {lastWorkoutProgress.map((ex) => (
                      <div key={ex.name} className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-text-secondary" strokeWidth={1.75} />
                        <span className="text-meta text-text-secondary font-normal">
                          {ex.name}
                        </span>
                        <span className="text-meta text-text-primary font-semibold ml-auto">
                          {formatWeight(ex.weight)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </GlassCard>
          ) : (
            <GlassCard>
              <p className="text-label-sm text-text-secondary font-semibold mb-2">
                {strings.home.lastWorkout}
              </p>
              <p className="text-meta text-text-secondary font-normal">
                {strings.home.noWorkoutHistory}
              </p>
            </GlassCard>
          )}

          {/* Weekly Progress */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <p className="text-label-sm text-text-secondary font-semibold">
                {strings.home.thisWeek}
              </p>
              <p className="text-meta text-text-primary font-semibold">
                {metrics.thisWeekCount} / {weekTarget} workout
              </p>
            </div>
            <ProgressBar value={weekTarget > 0 ? metrics.thisWeekCount / weekTarget : 0} />
            <div className="flex items-center justify-around gap-2 mt-4">
              {Array.from({ length: weekTarget }, (_, i) => {
                const isDone = i < metrics.thisWeekCount;
                return (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                      isDone
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.05] border-white/[0.08] text-text-secondary'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    )}
                  </div>
                );
              })}
            </div>
            {metrics.currentStreak > 0 && (
              <p className="text-meta text-text-secondary mt-4 flex items-center gap-1.5 font-normal">
                <Flame className="w-4 h-4 text-text-primary" strokeWidth={1.75} />
                Streak:{' '}
                <span className="text-text-primary font-semibold">
                  {metrics.currentStreak} {metrics.currentStreak === 1 ? 'giorno' : 'giorni'}
                </span>
              </p>
            )}
          </GlassCard>
        </div>
      </div>
    </AppShell>
  );
};
