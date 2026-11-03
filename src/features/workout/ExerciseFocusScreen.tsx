/* ============================================
   EXERCISE FOCUS SCREEN — visionOS Style
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronLeft } from 'lucide-react';
import { AppShell } from '@/components/layout';
import { Button, NumericStepper, IconButton, EmptyState, GlassCard } from '@/components/ui';
import { RestPresets } from '@/features/timer/TimerComponents';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTimerStore } from '@/features/timer/timerStore';
import { workoutRepo, programRepo } from '@/db/repositories';
import { formatTimerSeconds, formatWeight, formatWeightValue } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { WorkoutExerciseLog } from '@/types';
import { WeightEditorSheet } from './WeightEditorSheet';
import { ExerciseCompletedScreen } from './ExerciseCompletedScreen';

export const ExerciseFocusScreen: React.FC = () => {
  const { workoutId, exerciseId } = useParams<{
    workoutId: string;
    exerciseId: string;
  }>();
  const navigate = useNavigate();
  const {
    activeWorkout,
    resumeWorkout,
    completeSet,
    startExercise,
    completeExercise,
    updateExerciseLog,
  } = useWorkoutStore();
  const { timer, startTimer } = useTimerStore();

  const [exerciseLog, setExerciseLog] = useState<WorkoutExerciseLog | null>(null);
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(0);
  const [lastWeight, setLastWeight] = useState<number | null>(null);
  const [lastReps, setLastReps] = useState<number | null>(null);
  const [showWeightEditor, setShowWeightEditor] = useState(false);
  const [isCompletingSet, setIsCompletingSet] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [preferredRest, setPreferredRest] = useState(90);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [cardioElapsed, setCardioElapsed] = useState(0);
  const [cardioRunning, setCardioRunning] = useState(false);
  const initForExerciseRef = useRef<string | null>(null);

  const workout = activeWorkout;

  useEffect(() => {
    if (!workoutId) {
      setLoadState('missing');
      return;
    }
    if (activeWorkout?.id === workoutId) {
      setLoadState('ready');
      return;
    }
    let cancelled = false;
    void workoutRepo.getById(workoutId).then((w) => {
      if (cancelled) return;
      if (!w) {
        setLoadState('missing');
        return;
      }
      if (w.status !== 'active') {
        navigate(`/workout/${w.id}`, { replace: true });
        return;
      }
      resumeWorkout(w);
      setLoadState('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [workoutId, activeWorkout?.id, resumeWorkout, navigate]);

  useEffect(() => {
    if (!workout || !exerciseId) return;
    if (initForExerciseRef.current === exerciseId) return;

    const log = workout.exerciseLogs.find((e) => e.id === exerciseId);
    if (!log) {
      setLoadState('missing');
      return;
    }

    initForExerciseRef.current = exerciseId;
    setExerciseLog(log);

    if (log.status === 'pending') {
      void startExercise(log.id);
    }

    const loadInitial = async () => {
      if (log.exerciseTypeSnapshot === 'cardio') {
        if (log.cardioStartedAt) {
          const base = log.cardioElapsedSeconds ?? 0;
          const delta = Math.max(0, Math.floor((Date.now() - log.cardioStartedAt) / 1000));
          setCardioElapsed(base + delta);
          setCardioRunning(true);
        } else {
          setCardioElapsed(log.cardioElapsedSeconds ?? 0);
          setCardioRunning(false);
        }
      }

      const prevPerfMap = await workoutRepo.getPreviousPerformances(
        [log.exerciseTemplateId],
        workout.startedAt
      );
      const prevLog = prevPerfMap.get(log.exerciseTemplateId);

      if (prevLog && prevLog.setLogs.length > 0) {
        const lastSet = prevLog.setLogs[prevLog.setLogs.length - 1];
        setLastWeight(lastSet.weight);
        setLastReps(lastSet.reps);
        setWeight(lastSet.weight);
        setReps(lastSet.reps);
      } else {
        const prog = await programRepo.getActive();
        const exTemplate = prog?.sessions
          .flatMap((s) => s.exercises)
          .find((e) => e.id === log.exerciseTemplateId);

        if (exTemplate) {
          setWeight(exTemplate.defaultWeight ?? 0);
          setReps(exTemplate.targetReps ?? 8);
          if (exTemplate.restSeconds) {
            setPreferredRest(exTemplate.restSeconds);
          }
        }
      }
    };
    void loadInitial();
  }, [workout, exerciseId, startExercise]);

  useEffect(() => {
    if (!workout || !exerciseId) return;
    const currentLog = workout.exerciseLogs.find((e) => e.id === exerciseId);
    if (currentLog) {
      setExerciseLog(currentLog);
      if (currentLog.status === 'completed' && !showSuccess) {
        setShowSuccess(true);
      }
    }
  }, [workout, exerciseId, showSuccess]);

  const handleCompleteSet = useCallback(async () => {
    if (!workout || !exerciseLog || isCompletingSet) return;
    setIsCompletingSet(true);

    const setIndex = exerciseLog.setLogs.length;
    const plannedSets = exerciseLog.plannedSetsSnapshot;

    try {
      await completeSet(exerciseLog.id, {
        setNumber: setIndex + 1,
        reps,
        weight,
        completedAt: Date.now(),
      });
      const isLastSet = setIndex + 1 >= plannedSets;

      if (!isLastSet) {
        const restDuration = preferredRest;
        await startTimer(restDuration, exerciseLog.id, workout.id);
      } else {
        await completeExercise(exerciseLog.id);
        setShowSuccess(true);
      }
    } catch (e) {
      console.error('Failed to complete set:', e);
    } finally {
      setIsCompletingSet(false);
    }
  }, [
    workout,
    exerciseLog,
    isCompletingSet,
    reps,
    weight,
    completeSet,
    preferredRest,
    startTimer,
    completeExercise,
  ]);

  const handleToggleCardio = async () => {
    if (!exerciseLog || !workout) return;
    const now = Date.now();
    if (cardioRunning) {
      const delta = exerciseLog.cardioStartedAt
        ? Math.max(0, Math.floor((now - exerciseLog.cardioStartedAt) / 1000))
        : 0;
      const total = (exerciseLog.cardioElapsedSeconds ?? 0) + delta;
      setCardioElapsed(total);
      setCardioRunning(false);
      await updateExerciseLog({
        ...exerciseLog,
        cardioElapsedSeconds: total,
        cardioStartedAt: undefined,
      });
    } else {
      setCardioRunning(true);
      await updateExerciseLog({
        ...exerciseLog,
        cardioStartedAt: now,
      });
    }
  };

  const handleResetCardio = async () => {
    if (!exerciseLog || !workout) return;
    setCardioElapsed(0);
    setCardioRunning(false);
    await updateExerciseLog({
      ...exerciseLog,
      cardioElapsedSeconds: 0,
      cardioStartedAt: undefined,
    });
  };

  const handleCompleteCardio = async () => {
    if (!exerciseLog || !workout || isCompletingSet) return;
    setIsCompletingSet(true);
    try {
      let finalSeconds = cardioElapsed;
      if (cardioRunning && exerciseLog.cardioStartedAt) {
        const delta = Math.max(0, Math.floor((Date.now() - exerciseLog.cardioStartedAt) / 1000));
        finalSeconds += delta;
      }
      await completeSet(exerciseLog.id, {
        setNumber: 1,
        reps: 1,
        weight: 0,
        durationSeconds: finalSeconds,
        completedAt: Date.now(),
      });
      await completeExercise(exerciseLog.id);
      setShowSuccess(true);
    } finally {
      setIsCompletingSet(false);
    }
  };

  const handleStartTimer = async (seconds: number) => {
    if (!workout || !exerciseLog) return;
    setPreferredRest(seconds);
    await startTimer(seconds, exerciseLog.id, workout.id);
  };

  const handleContinueAfterSuccess = () => {
    if (!workout || !exerciseLog) return;
    const sorted = [...workout.exerciseLogs].sort((a, b) => a.order - b.order);
    const currentIndex = sorted.findIndex((e) => e.id === exerciseLog.id);
    const nextExercise = sorted.slice(currentIndex + 1).find((e) => e.status !== 'completed');

    if (nextExercise) {
      navigate(`/workout/${workout.id}/exercise/${nextExercise.id}`, { replace: true });
    } else {
      navigate(`/workout/${workout.id}`, { replace: true });
    }
  };

  const handleAddExtraSet = () => {
    if (!exerciseLog) return;
    setShowSuccess(false);
  };

  if (loadState === 'missing') {
    return (
      <AppShell showNav={false}>
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title={strings.errors.workoutNotFound}
            description={strings.errors.workoutNotFoundDetail}
            action={
              <Button variant="secondary" onClick={() => navigate('/', { replace: true })}>
                {strings.errors.goHome}
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  if (loadState === 'loading' || !workout || !exerciseLog) {
    return (
      <AppShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (showSuccess) {
    return (
      <ExerciseCompletedScreen
        exerciseLog={exerciseLog}
        onContinue={handleContinueAfterSuccess}
        onAddExtraSet={handleAddExtraSet}
      />
    );
  }

  const isCardio = exerciseLog.exerciseTypeSnapshot === 'cardio';
  const plannedDuration = exerciseLog.plannedDurationSeconds ?? 0;
  const sortedLogs = [...workout.exerciseLogs].sort((a, b) => a.order - b.order);
  const exerciseIndex = sortedLogs.findIndex((e) => e.id === exerciseId);
  const completedSets = exerciseLog.setLogs.length;
  const plannedSets = exerciseLog.plannedSetsSnapshot;
  const currentSetNum = completedSets + 1;

  return (
    <AppShell showNav={false}>
      <div className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom))]">
        {/* Header */}
        <div className="pt-[calc(env(safe-area-inset-top)+8px)] px-4">
          <div className="flex items-center justify-between h-14">
            <IconButton
              label={strings.workout.backToOverview}
              onClick={() => navigate(`/workout/${workout.id}`)}
              className="-ml-2 w-auto min-w-[48px] gap-1 px-2 rounded-2xl"
            >
              <ChevronLeft className="w-5 h-5 text-text-primary" strokeWidth={1.75} />
              <span className="text-meta text-text-secondary font-normal">{workout.sessionNameSnapshot}</span>
            </IconButton>
            <span className="text-meta text-text-secondary font-normal">
              {exerciseIndex + 1} / {sortedLogs.length}
            </span>
          </div>
        </div>

        {/* Exercise Name */}
        <div className="px-4 pt-2 pb-4">
          <motion.h1
            key={exerciseLog.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-title font-semibold text-text-primary leading-tight"
          >
            {exerciseLog.exerciseNameSnapshot}
          </motion.h1>
          <p className="text-body text-text-secondary mt-1 font-normal">
            {isCardio ? strings.sessionDetail.cardio : strings.workout.seriesLabel(currentSetNum, plannedSets)}
          </p>
          {exerciseLog.notesSnapshot && (
            <p className="text-meta text-text-secondary mt-4 whitespace-pre-line rounded-card border border-white/[0.08] bg-white/[0.04] p-4 font-normal">
              {exerciseLog.notesSnapshot}
            </p>
          )}
        </div>

        {/* Last Performance */}
        {(lastWeight !== null || lastReps !== null) && (
          <div className="px-4 mb-4">
            <GlassCard>
              <p className="text-label-sm text-text-secondary mb-1 font-semibold">
                {strings.workout.lastTime}
              </p>
              <p className="text-heading font-semibold text-text-primary">
                {lastWeight !== null ? formatWeight(lastWeight) : '—'}
                {lastReps !== null ? ` × ${lastReps}` : ''}
              </p>
            </GlassCard>
          </div>
        )}

        {/* Reps Stepper */}
        {!isCardio && (
          <div className="px-4 mb-4">
            <GlassCard className="p-6">
              <NumericStepper
                value={reps}
                onChange={setReps}
                min={1}
                max={99}
                label={strings.workout.reps}
              />
            </GlassCard>
          </div>
        )}

        {/* Weight Display */}
        {!isCardio && (
          <div className="px-4 mb-4">
            <GlassCard className="p-4">
              <p className="text-label-sm text-text-secondary mb-2 font-semibold">
                {strings.workout.weight}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-display font-semibold text-text-primary tabular-nums">
                  {weight === 0 ? 'BW' : formatWeightValue(weight)}
                  {weight > 0 && (
                    <span className="text-[20px] font-normal text-text-secondary ml-1">
                      kg
                    </span>
                  )}
                </span>
                <button
                  onClick={() => setShowWeightEditor(true)}
                  className="text-text-primary text-meta font-semibold min-h-[48px] px-4 rounded-btn bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.10] transition-colors"
                >
                  {strings.workout.edit}
                </button>
              </div>
            </GlassCard>
          </div>
        )}

        {/* Complete Set CTA */}
        {isCardio ? (
          <div className="px-4 mb-4">
            <GlassCard className="p-6">
              <p className="text-label-sm text-text-secondary mb-4 font-semibold text-center">
                {strings.workout.duration}
              </p>
              <div className="text-center mb-4">
                <span className="text-numeric-lg font-semibold text-text-primary tabular-nums">
                  {formatTimerSeconds(cardioElapsed)}
                </span>
                {plannedDuration > 0 && (
                  <span className="text-[20px] font-normal text-text-secondary ml-2">
                    / {formatTimerSeconds(plannedDuration)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 mb-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={handleToggleCardio}
                >
                  {cardioRunning
                    ? strings.workout.pause
                    : strings.workout.cardioStart}
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={handleResetCardio}
                >
                  {strings.workout.reset}
                </Button>
              </div>
              <Button
                variant="primary"
                fullWidth
                isLoading={isCompletingSet}
                onClick={handleCompleteCardio}
              >
                {strings.workout.cardioComplete}
              </Button>
            </GlassCard>
          </div>
        ) : (
          <div className="px-4 mb-4">
            <Button
              variant="primary"
              fullWidth
              isLoading={isCompletingSet}
              onClick={handleCompleteSet}
            >
              {strings.workout.completeSet}
            </Button>
          </div>
        )}

        {/* Sets Overview */}
        <div className="px-4 mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-label-sm text-text-secondary font-semibold">Serie</p>
            {!isCardio && (
              <button
                type="button"
                onClick={handleAddExtraSet}
                className="min-h-[48px] -my-2 px-2 flex items-center text-label-sm text-text-primary font-semibold hover:underline"
              >
                + Aggiungi serie
              </button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: Math.max(plannedSets, completedSets) }, (_, i) => {
              const setLog = exerciseLog.setLogs[i];
              const isCurrent = i === completedSets;
              return (
                <div
                  key={i}
                  className={`flex-1 min-w-[72px] p-4 rounded-card border text-center transition-all ${
                    setLog
                      ? 'bg-white text-black border-white'
                      : isCurrent
                      ? 'bg-white/[0.12] border-white/[0.24] text-white'
                      : 'bg-white/[0.04] border-white/[0.06] text-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    {setLog ? (
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    ) : isCurrent ? (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </div>
                  <p className={`text-label-sm font-semibold ${setLog ? 'text-black' : 'text-text-secondary'}`}>
                    Serie {i + 1}
                  </p>
                  {setLog && (
                    <p className="text-meta font-semibold mt-0.5 tabular-nums text-black">
                      {setLog.reps} × {formatWeightValue(setLog.weight)} kg
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Rest Presets */}
        <div className="px-4 mb-4">
          <p className="text-label-sm text-text-secondary font-semibold mb-2">
            {strings.workout.restPresets}
          </p>
          <RestPresets
            preferredSeconds={preferredRest}
            onSelect={handleStartTimer}
            activeSeconds={
              timer?.status === 'running' ? timer.durationSeconds : undefined
            }
          />
        </div>
      </div>

      {/* Weight Editor Sheet */}
      <AnimatePresence>
        {showWeightEditor && (
          <WeightEditorSheet
            currentWeight={weight}
            lastWeight={lastWeight ?? undefined}
            exerciseName={exerciseLog.exerciseNameSnapshot}
            setNumber={currentSetNum}
            onSave={(w) => {
              setWeight(w);
              setShowWeightEditor(false);
            }}
            onCancel={() => setShowWeightEditor(false)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
};
