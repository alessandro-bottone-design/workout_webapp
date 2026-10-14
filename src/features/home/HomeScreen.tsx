/* ============================================
   HOME SCREEN
   Shows today's workout, session selector, gym hours, last workout, weekly progress
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Dumbbell, TrendingUp, Settings, Clock, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button, ProgressBar, EmptyState, AppLogo, ScreenTitle, IconButton } from '@/components/ui';
import { programRepo, workoutRepo, settingsRepo } from '@/db/repositories';
import { useWorkoutStore } from '@/stores/workoutStore';
import { getNextSessionId, getWorkoutMetrics } from '@/lib/selectors';
import { getRepresentativeWeight } from '@/lib/selectors';
import { getGymStatus, GYM_SCHEDULE } from '@/lib/gymSchedule';
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

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Buongiorno' : hour < 17 ? 'Buon pomeriggio' : 'Buonasera';

  const gymStatus = getGymStatus();
  const todayDayOfWeek = new Date().getDay();

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await loadActiveWorkout();
      const [prog, workouts, settings] = await Promise.all([
        programRepo.getFirst(),
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
    };
    void load();
  }, [loadActiveWorkout]);

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
    if (!program || !currentSession) return;
    const workout = await useWorkoutStore.getState().startWorkout(program.id, {
      id: currentSession.id,
      name: currentSession.name,
      exercises: currentSession.exercises,
    });
    navigate(`/workout/${workout.id}`);
  };

  const handleResume = () => {
    if (activeWorkout) navigate(`/workout/${activeWorkout.id}`);
  };

  // Get strength exercises from last workout for progress display
  const lastWorkoutProgress = lastWorkout?.exerciseLogs
    .filter((e) => e.exerciseTypeSnapshot === 'strength' && e.status === 'completed' && e.setLogs.length > 0)
    .slice(0, 2)
    .map((e) => ({
      name: e.exerciseNameSnapshot,
      weight: getRepresentativeWeight(e),
    })) ?? [];

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))]">
        {/* Header: LogoDef + Greeting */}
        <div className="pt-[calc(env(safe-area-inset-top)+16px)] px-5 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-4"
          >
            <AppLogo width={156} />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <ScreenTitle size="lg" className="tracking-[-0.42px]">
                  {greeting}
                </ScreenTitle>
                <p className="text-body text-text-secondary mt-1">
                  {strings.home.subtitle}
                </p>
              </div>
              <IconButton
                label="Impostazioni"
                onClick={() => navigate('/settings')}
                className="-mr-2 -mt-1"
              >
                <Settings className="w-5 h-5" strokeWidth={2} />
              </IconButton>
            </div>
          </motion.div>
        </div>

        <div className="px-5 space-y-4">
          {/* Resume Active Workout Banner */}
          {activeWorkout && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-accent-primary/10 border border-accent-primary/30 rounded-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-label-sm text-accent-primary mb-0.5">
                  ALLENAMENTO IN CORSO
                </p>
                <p className="text-heading text-text-primary">
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
            <div className="space-y-2.5">
              {/* Session Selector Chips */}
              <div className="flex items-center justify-between px-1">
                <p className="text-label-sm text-text-secondary">
                  SCEGLI LA SEDUTA DI OGGI
                </p>
                {isRecommended && (
                  <span className="text-[11px] font-semibold text-accent-primary flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Consigliata da rotazione
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-none">
                {sortedSessions.map((session) => {
                  const isSelected = session.id === currentSession?.id;
                  const isRec = session.id === recommendedSessionId;

                  return (
                    <motion.button
                      key={session.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`min-h-[44px] px-4 py-2 rounded-btn text-[14px] font-semibold transition-all whitespace-nowrap flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-accent-primary text-bg-app border-accent-primary shadow-sm'
                          : 'bg-bg-surface text-text-secondary border-border-default hover:text-text-primary hover:border-text-secondary/40'
                      }`}
                    >
                      <span>{session.name}</span>
                      {isRec && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isSelected
                              ? 'bg-bg-app/20 text-bg-app'
                              : 'bg-accent-primary/15 text-accent-primary'
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
                <motion.div
                  key={currentSession.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-bg-surface rounded-card border border-border-default overflow-hidden"
                >
                  <div className="p-5 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-label-sm text-text-secondary">
                        {isRecommended ? 'IN PROGRAMMA OGGI' : 'SEDUTA SELEZIONATA'}
                      </p>
                      <span className="text-meta text-accent-primary font-semibold">
                        {currentSession.exercises.length} esercizi
                      </span>
                    </div>

                    <h2 className="screen-title text-[28px] leading-tight">
                      {currentSession.name.toUpperCase()}
                    </h2>

                    <div className="mt-4 space-y-2.5">
                      {currentSession.exercises.map((ex) => (
                        <div key={ex.id} className="flex items-center gap-2.5 text-left">
                          <div className="w-1.5 h-1.5 rounded-full bg-accent-primary/60 flex-shrink-0" />
                          <span className="text-meta text-text-primary truncate">{ex.name}</span>
                          {ex.type === 'strength' && ex.sets ? (
                            <span className="text-meta text-text-secondary opacity-60 ml-auto whitespace-nowrap">
                              {ex.sets} × {ex.targetReps}
                              {ex.defaultWeight ? ` · ${ex.defaultWeight}kg` : ''}
                            </span>
                          ) : (
                            <span className="text-meta text-text-secondary opacity-60 ml-auto whitespace-nowrap">
                              {Math.round((ex.durationSeconds ?? 0) / 60)} min
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-1">
                    <Button variant="primary" fullWidth onClick={handleStart}>
                      {strings.home.startWorkout}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          ) : !activeWorkout && !isLoading ? (
            <EmptyState
              icon={<Dumbbell className="w-8 h-8" />}
              title="Nessuna scheda"
              description={strings.home.noProgram}
              action={
                <Button variant="secondary" size="sm" onClick={() => navigate('/program')}>
                  Vai alla scheda
                </Button>
              }
            />
          ) : null}

          {/* Gym Hours Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-bg-surface rounded-card border border-border-default p-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-bg-elevated flex items-center justify-center text-text-primary">
                  <Clock className="w-5 h-5 text-accent-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-label-sm text-text-secondary uppercase">
                      ORARI PALESTRA
                    </p>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        gymStatus.isOpen
                          ? 'bg-accent-primary animate-pulse'
                          : 'bg-text-secondary opacity-40'
                      }`}
                    />
                  </div>
                  <h3 className="text-heading text-text-primary mt-0.5">
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
                className="text-meta text-accent-primary font-semibold hover:underline min-h-[44px] flex items-center px-1"
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
                  className="mt-4 pt-3 border-t border-border-default space-y-2 overflow-hidden"
                >
                  {GYM_SCHEDULE.map((item) => {
                    const isToday = item.days.includes(todayDayOfWeek);
                    return (
                      <div
                        key={item.dayLabel}
                        className={`flex items-center justify-between text-meta py-1 px-2.5 rounded-btn ${
                          isToday
                            ? 'bg-accent-primary/10 text-accent-primary font-semibold'
                            : 'text-text-secondary'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {item.dayLabel}
                          {isToday && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-accent-primary text-bg-app font-bold">
                              Oggi
                            </span>
                          )}
                        </span>
                        <span className={isToday ? 'text-accent-primary' : 'text-text-primary'}>
                          {item.hoursFormatted}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Last Workout */}
          {lastWorkout ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-bg-surface rounded-card border border-border-default p-5"
            >
              <p className="text-label-sm text-text-secondary mb-3">
                {strings.home.lastWorkout}
              </p>
              <button
                className="w-full text-left"
                onClick={() => navigate(`/workout/${lastWorkout.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-heading text-text-primary">
                      {lastWorkout.sessionNameSnapshot}
                    </h3>
                    <p className="text-meta text-text-secondary mt-0.5">
                      {lastWorkout.completedAt
                        ? formatDuration(lastWorkout.completedAt - lastWorkout.startedAt)
                        : '—'}
                      {' · '}
                      {lastWorkout.exerciseLogs.filter((e) => e.status === 'completed').length} esercizi
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-secondary mt-0.5" />
                </div>

                {lastWorkoutProgress.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {lastWorkoutProgress.map((ex) => (
                      <div key={ex.name} className="flex items-center gap-2">
                        <TrendingUp className="w-3.5 h-3.5 text-accent-primary" />
                        <span className="text-meta text-text-secondary">
                          {ex.name}
                        </span>
                        <span className="text-meta text-accent-primary font-semibold ml-auto">
                          {formatWeight(ex.weight)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="bg-bg-surface rounded-card border border-border-default p-5"
            >
              <p className="text-label-sm text-text-secondary mb-2">
                {strings.home.lastWorkout}
              </p>
              <p className="text-meta text-text-secondary">
                {strings.home.noWorkoutHistory}
              </p>
            </motion.div>
          )}

          {/* Weekly Progress */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="bg-bg-surface rounded-card border border-border-default p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-label-sm text-text-secondary">
                {strings.home.thisWeek}
              </p>
              <p className="text-meta text-text-primary font-semibold">
                {metrics.thisWeekCount} / {weekTarget} workout
              </p>
            </div>
            <ProgressBar value={metrics.thisWeekCount / weekTarget} />
            <div className="flex gap-2 mt-4">
              {Array.from({ length: weekTarget }, (_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[18px] ${
                    i < metrics.thisWeekCount
                      ? 'text-accent-primary'
                      : 'text-text-secondary opacity-30'
                  }`}
                >
                  ●
                </div>
              ))}
            </div>
            {metrics.currentStreak > 0 && (
              <p className="text-meta text-text-secondary mt-3">
                🔥 Streak:{' '}
                <span className="text-text-primary font-semibold">
                  {metrics.currentStreak} giorni
                </span>
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
};
