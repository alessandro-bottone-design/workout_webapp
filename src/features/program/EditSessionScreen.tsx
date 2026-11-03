/* ============================================
   EDIT SESSION SCREEN
   Drag-to-reorder, add, delete exercises
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, ConfirmDialog } from '@/components/ui';
import { programRepo } from '@/db/repositories';
import { generateId } from '@/lib/ids';
import { strings } from '@/lib/strings';
import type { SessionTemplate, ExerciseTemplate, Program } from '@/types';

const SortableExItem: React.FC<{
  exercise: ExerciseTemplate;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ exercise, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        <button
          {...attributes}
          {...listeners}
          aria-label={strings.editSession.reorder}
          className="touch-none w-12 h-12 -ml-2 flex items-center justify-center text-text-secondary opacity-40 hover:opacity-100 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" strokeWidth={1.75} />
        </button>
        <button className="flex-1 text-left min-h-[48px] flex flex-col justify-center" onClick={onEdit}>
          <p className="text-[15px] font-semibold text-text-primary">
            {exercise.name}
          </p>
          <p className="text-meta text-text-secondary mt-0.5">
            {exercise.type === 'cardio'
              ? 'Cardio'
              : `${exercise.sets} × ${exercise.targetReps}`}
          </p>
        </button>
        <button
          onClick={onDelete}
          aria-label={`Elimina ${exercise.name}`}
          className="w-12 h-12 flex items-center justify-center text-text-secondary hover:text-danger transition-colors rounded-full"
        >
          <Trash2 className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
};

export const EditSessionScreen: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [session, setSession] = useState<SessionTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ExerciseTemplate | null>(null);

  const sensors = useSensors(
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    const load = async () => {
      const prog = await programRepo.getFirst();
      if (!prog || !sessionId) return;
      setProgram(prog);
      const s = prog.sessions.find((s) => s.id === sessionId);
      if (s) setSession({ ...s, exercises: [...s.exercises] });
    };
    void load();
  }, [sessionId]);

  const persistSession = async (updated: SessionTemplate) => {
    if (!program) return;
    setSession(updated);
    try {
      await programRepo.updateSession(program.id, updated);
    } catch (e) {
      console.error('Failed to persist session', e);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!session) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const sorted = [...session.exercises].sort((a, b) => a.order - b.order);
    const oldIdx = sorted.findIndex((e) => e.id === active.id);
    const newIdx = sorted.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(sorted, oldIdx, newIdx).map((e, i) => ({
      ...e,
      order: i,
    }));
    await persistSession({ ...session, exercises: reordered });
  };

  const handleAddExercise = async () => {
    if (!session || !program) return;
    try {
      await programRepo.updateSession(program.id, session);
    } catch (e) {
      console.error('Failed to persist session before adding exercise', e);
    }
    const newEx: ExerciseTemplate = {
      id: generateId(),
      name: 'Nuovo esercizio',
      type: 'strength',
      order: session.exercises.length,
      sets: 3,
      targetReps: 10,
      defaultWeight: 0,
      restSeconds: 90,
    };
    navigate(`/exercise/${newEx.id}/edit`, {
      state: {
        programId: program.id,
        sessionId: session.id,
        newExercise: newEx,
        isNew: true,
      },
    });
  };

  const handleDeleteExercise = async () => {
    if (!session || !program || !deleteTarget) return;
    const updated = {
      ...session,
      exercises: session.exercises
        .filter((e) => e.id !== deleteTarget.id)
        .map((e, i) => ({ ...e, order: i })),
    };
    setDeleteTarget(null);
    await persistSession(updated);
  };

  if (!session) {
    return (
      <AppShell showNav={false}>
        <ScreenHeader title={strings.editSession.title} showBack titleSize="sm" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  const sorted = [...session.exercises].sort((a, b) => a.order - b.order);

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={`Modifica ${session.name}`}
        showBack
      />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sorted.map((e) => e.id)}
              strategy={verticalListSortingStrategy}
            >
              {sorted.map((ex) => (
                <SortableExItem
                  key={ex.id}
                  exercise={ex}
                  onEdit={() =>
                    navigate(`/exercise/${ex.id}/edit`, {
                      state: { programId: program?.id, sessionId: session.id },
                    })
                  }
                  onDelete={() => setDeleteTarget(ex)}
                />
              ))}
            </SortableContext>
          </DndContext>

          {/* Add Exercise */}
          <button
            onClick={handleAddExercise}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] text-text-secondary hover:text-text-primary hover:border-white/30 hover:bg-white/[0.04] transition-all mt-2 h-14"
          >
            <Plus className="w-5 h-5" strokeWidth={1.75} />
            <span className="text-meta font-semibold">
              {strings.program.addExercise}
            </span>
          </button>
        </div>
      </div>

      {/* Done Button — edits auto-save, this just returns to the session */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-4 pb-8 pt-4 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-20">
        <Button variant="primary" fullWidth onClick={() => navigate(-1)}>
          {strings.actions.done}
        </Button>
      </div>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <ConfirmDialog
            isOpen={!!deleteTarget}
            title={strings.editExercise.confirmDelete}
            description={strings.editExercise.confirmDeleteDetail}
            confirmLabel={strings.actions.delete}
            cancelLabel={strings.actions.cancel}
            onConfirm={handleDeleteExercise}
            onCancel={() => setDeleteTarget(null)}
            isDanger
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
};
