/* ============================================
   WORKOUT OVERVIEW SCREEN — visionOS Style
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React, { memo, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ChevronRight, GripVertical, X } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, ProgressBar, ConfirmDialog, IconButton, EmptyState, GlassCard } from '@/components/ui';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useTimerStore } from '@/features/timer/timerStore';
import { workoutRepo } from '@/db/repositories';
import { formatDuration, formatWeightValue } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { WorkoutExerciseLog, Workout } from '@/types';

/* ============================================
   SORTABLE EXERCISE ROW
   ============================================ */

interface ExerciseRowProps {
  log: WorkoutExerciseLog;
  isActive: boolean;
  onTap: () => void;
  isDragging?: boolean;
}

const SortableExerciseRow: React.FC<ExerciseRowProps & { id: string }> = ({
  id,
  log,
  isActive,
  onTap,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const completedSets = log.setLogs.length;
  const plannedSets = log.plannedSetsSnapshot;

  return (
    <div ref={setNodeRef} style={style}>
      <motion.div
        animate={{ opacity: isDragging ? 0.7 : 1 }}
        className={`flex items-center gap-4 p-4 rounded-card border transition-all duration-200 ${
          isActive
            ? 'bg-white/[0.10] border-white/[0.22] shadow-lg'
            : log.status === 'completed'
            ? 'bg-white/[0.03] border-white/[0.06] opacity-60'
            : 'bg-white/[0.05] border-white/[0.08] hover:bg-white/[0.08]'
        }`}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          aria-label={`Riordina ${log.exerciseNameSnapshot}`}
          className="touch-none w-12 h-12 -ml-2 flex items-center justify-center text-text-secondary opacity-40 hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" strokeWidth={1.75} />
        </button>

        {/* Status Icon */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            log.status === 'completed'
              ? 'bg-white text-black'
              : isActive
              ? 'bg-white/[0.15] text-white border border-white/[0.30]'
              : 'bg-white/[0.06] border border-white/[0.08] text-text-secondary'
          }`}
        >
          {log.status === 'completed' ? (
            <Check className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <span className="text-label-sm font-semibold">{completedSets}</span>
          )}
        </div>

        {/* Exercise Info */}
        <button className="flex-1 text-left min-w-0 min-h-[48px] flex flex-col justify-center" onClick={onTap}>
          <p
            className={`text-[15px] font-semibold truncate ${
              log.status === 'completed'
                ? 'text-text-secondary line-through'
                : 'text-text-primary'
            }`}
          >
            {log.exerciseNameSnapshot}
          </p>
          <p className="text-meta text-text-secondary mt-0.5 font-normal">
            {log.exerciseTypeSnapshot === 'cardio'
              ? 'Cardio'
              : `${completedSets} / ${plannedSets} serie`}
          </p>
        </button>

        {/* Chevron */}
        {log.status !== 'completed' && (
          <button
            onClick={onTap}
            aria-label={`Apri ${log.exerciseNameSnapshot}`}
            className="w-12 h-12 -mr-2 flex items-center justify-center"
          >
            <ChevronRight
              className={`w-5 h-5 ${isActive ? 'text-white' : 'text-text-secondary'}`}
              strokeWidth={1.75}
            />
          </button>
        )}
      </motion.div>
    </div>
  );
};

/* ============================================
   WORKOUT ELAPSED TIMER
   ============================================ */

const WorkoutElapsedTimer = memo(({ startedAt }: { startedAt: number }) => {
  const [elapsedMs, setElapsedMs] = useState(() => Date.now() - startedAt);

  useEffect(() => {
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt), 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return <>{formatDuration(elapsedMs)}</>;
});
WorkoutElapsedTimer.displayName = 'WorkoutElapsedTimer';

/* ============================================
   WORKOUT OVERVIEW SCREEN
   ============================================ */

export const WorkoutOverviewScreen: React.FC = () => {
  const { workoutId } = useParams<{ workoutId: string }>();
  const navigate = useNavigate();
  const {
    activeWorkout,
    resumeWorkout,
    reorderExercises,
    completeWorkout,
    cancelWorkout,
  } = useWorkoutStore();

  const [localWorkout, setLocalWorkout] = useState<Workout | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEarlyCompleteConfirm, setShowEarlyCompleteConfirm] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const { stopTimer } = useTimerStore();

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    const load = async () => {
      if (!workoutId) {
        setNotFound(true);
        return;
      }
      if (activeWorkout?.id === workoutId) {
        setLocalWorkout(activeWorkout);
        return;
      }
      const w = await workoutRepo.getById(workoutId);
      if (w) {
        setLocalWorkout(w);
        if (w.status === 'active') resumeWorkout(w);
      } else {
        setNotFound(true);
      }
    };
    void load();
  }, [workoutId, activeWorkout, resumeWorkout]);

  useEffect(() => {
    if (activeWorkout?.id === workoutId) {
      setLocalWorkout(activeWorkout);
    }
  }, [activeWorkout, workoutId]);

  const workout = localWorkout;
  if (notFound) {
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

  if (!workout) {
    return (
      <AppShell showNav={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white border-t-transparent animate-spin" />
        </div>
      </AppShell>
    );
  }

  const sortedLogs = [...workout.exerciseLogs].sort((a, b) => a.order - b.order);
  const completedCount = sortedLogs.filter((e) => e.status === 'completed').length;
  const totalCount = sortedLogs.length;
  const activeLog = sortedLogs.find((e) => e.status === 'active');
  const progress = totalCount > 0 ? completedCount / totalCount : 0;
  const allCompleted = completedCount === totalCount;
  const isReadOnly = workout.status !== 'active';

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !workout) return;

    const oldIndex = sortedLogs.findIndex((e) => e.id === active.id);
    const newIndex = sortedLogs.findIndex((e) => e.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(sortedLogs, oldIndex, newIndex);
      const updatedLogs = reordered.map((e, idx) => ({ ...e, order: idx }));
      setLocalWorkout({ ...workout, exerciseLogs: updatedLogs });
      void reorderExercises(updatedLogs.map((e) => e.id));
    }
  };

  const handleExerciseTap = (log: WorkoutExerciseLog) => {
    navigate(`/workout/${workout.id}/exercise/${log.id}`);
  };

  const handleCompleteWorkout = async () => {
    if (!workout || isCompleting) return;
    setIsCompleting(true);
    try {
      await stopTimer();
      await completeWorkout();
      navigate(`/workout/${workout.id}/complete`, { replace: true });
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    if (!workout) return;
    await stopTimer();
    await cancelWorkout();
    navigate('/', { replace: true });
  };

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={workout.sessionNameSnapshot}
        subtitle={
          <span className="tabular-nums font-semibold text-text-primary">
            <WorkoutElapsedTimer startedAt={workout.startedAt} />
          </span>
        }
        showBack
        onBack={() => navigate('/')}
        rightAction={
          !isReadOnly && (
            <IconButton
              label={strings.workout.cancelWorkout}
              onClick={() => setShowCancelConfirm(true)}
              tone="default"
            >
              <X className="w-5 h-5" strokeWidth={1.75} />
            </IconButton>
          )
        }
      />

      <div className="flex-1 overflow-y-auto pb-[calc(96px+env(safe-area-inset-bottom))]">
        {/* Progress Bar Header */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between text-meta text-text-secondary mb-2">
            <span className="font-normal">
              {strings.workout.progress(completedCount, totalCount)}
            </span>
            {allCompleted && (
              <span className="text-white font-semibold flex items-center gap-1">
                <Check className="w-4 h-4" strokeWidth={2} /> Completato
              </span>
            )}
          </div>
          <ProgressBar value={progress} />
        </div>

        {/* Exercises List */}
        <div className="px-4 mt-2">
          {!isReadOnly ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedLogs.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {sortedLogs.map((log) => (
                    <SortableExerciseRow
                      key={log.id}
                      id={log.id}
                      log={log}
                      isActive={activeLog?.id === log.id}
                      onTap={() => handleExerciseTap(log)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="space-y-2">
              {sortedLogs.map((log) => {
                const isCardio = log.exerciseTypeSnapshot === 'cardio';
                const cardioSeconds = log.setLogs[0]?.durationSeconds ?? 0;

                return (
                  <GlassCard key={log.id} className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          log.status === 'completed'
                            ? 'bg-white text-black'
                            : 'bg-white/[0.06] border border-white/[0.08] text-text-secondary'
                        }`}
                      >
                        {log.status === 'completed' ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <span className="text-label-sm font-semibold">{log.setLogs.length}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-[15px] font-semibold text-text-primary">
                            {log.exerciseNameSnapshot}
                          </p>
                          <span className="text-meta text-text-secondary font-normal">
                            {isCardio ? 'Cardio' : `${log.setLogs.length} serie`}
                          </span>
                        </div>

                        {log.notesSnapshot && (
                          <p className="text-meta text-text-secondary mt-1 font-normal">
                            {log.notesSnapshot}
                          </p>
                        )}

                        {isCardio ? (
                          <div className="mt-2">
                            <span className="inline-flex items-center text-meta bg-white/[0.06] border border-white/[0.08] px-4 py-1 rounded-btn text-text-primary tabular-nums">
                              Durata: {formatDuration(cardioSeconds * 1000)}
                            </span>
                          </div>
                        ) : log.setLogs.length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {log.setLogs.map((s, sIdx) => (
                              <span
                                key={s.id}
                                className="inline-flex items-center text-meta bg-white/[0.06] border border-white/[0.08] px-4 py-1 rounded-btn text-text-primary tabular-nums font-normal"
                              >
                                <span className="text-text-secondary text-label-sm mr-1.5 font-semibold">
                                  #{sIdx + 1}
                                </span>
                                {s.weight > 0 ? `${formatWeightValue(s.weight)} kg × ` : ''}
                                {s.reps} rip
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-meta text-text-secondary mt-1 font-normal italic">
                            Nessuna serie registrata
                          </p>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>

        {/* Complete Workout CTA */}
        {!isReadOnly && (
          <div className="px-4 mt-6">
            {allCompleted ? (
              <Button
                variant="primary"
                fullWidth
                isLoading={isCompleting}
                onClick={handleCompleteWorkout}
              >
                {strings.workout.completeWorkoutCta}
              </Button>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-meta text-text-secondary font-normal">
                  {strings.workout.allDoneHint}
                </p>
                <Button
                  variant="secondary"
                  fullWidth
                  isLoading={isCompleting}
                  onClick={() => setShowEarlyCompleteConfirm(true)}
                >
                  {strings.workout.earlyCompleteCta}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirm Early Complete Dialog */}
      <AnimatePresence>
        {showEarlyCompleteConfirm && (
          <ConfirmDialog
            isOpen={showEarlyCompleteConfirm}
            title={strings.workout.earlyCompleteTitle}
            description={strings.workout.earlyCompleteDetail}
            confirmLabel={strings.workout.cancelWorkout}
            cancelLabel={strings.actions.cancel}
            onConfirm={async () => {
              setShowEarlyCompleteConfirm(false);
              await handleCompleteWorkout();
            }}
            onCancel={() => setShowEarlyCompleteConfirm(false)}
          />
        )}
      </AnimatePresence>

      {/* Confirm Cancel Dialog */}
      <AnimatePresence>
        {showCancelConfirm && (
          <ConfirmDialog
            isOpen={showCancelConfirm}
            title={strings.workout.inProgress}
            description={strings.workout.confirmCancelDetail}
            confirmLabel={strings.workout.cancelWorkout}
            cancelLabel={strings.workout.resumeWorkout}
            onConfirm={handleCancel}
            onCancel={() => setShowCancelConfirm(false)}
            isDanger
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
};
