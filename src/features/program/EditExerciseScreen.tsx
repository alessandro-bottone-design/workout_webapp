/* ============================================
   EDIT EXERCISE SCREEN
   Form to edit all exercise fields
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, ConfirmDialog, EmptyState } from '@/components/ui';
import { programRepo } from '@/db/repositories';
import { generateId } from '@/lib/ids';
import { parseWeight } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import type { ExerciseTemplate, ExerciseType } from '@/types';

interface FormState {
  name: string;
  type: ExerciseType;
  sets: string;
  targetReps: string;
  defaultWeight: string;
  restSeconds: string;
  durationMinutes: string;
  notes: string;
}

const inputClass =
  'w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 h-12 text-text-primary text-body focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all placeholder:text-text-secondary/50';
const labelClass = 'text-label-sm text-text-secondary mb-2 block font-semibold';

export const EditExerciseScreen: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as {
    programId?: string;
    sessionId?: string;
    newExercise?: ExerciseTemplate;
    isNew?: boolean;
  } | null;

  const [form, setForm] = useState<FormState>({
    name: '',
    type: 'strength',
    sets: '3',
    targetReps: '8',
    defaultWeight: '0',
    restSeconds: '90',
    durationMinutes: '10',
    notes: '',
  });
  const [programId, setProgramId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadState('loading');
      let pId = state?.programId ?? null;
      let sId = state?.sessionId ?? null;
      setProgramId(pId);
      setSessionId(sId);

      // If new exercise passed via state
      if (state?.newExercise && state.isNew) {
        const ex = state.newExercise;
        if (cancelled) return;
        setForm({
          name: ex.name === 'Nuovo esercizio' ? '' : ex.name,
          type: ex.type,
          sets: String(ex.sets ?? 3),
          targetReps: String(ex.targetReps ?? 8),
          defaultWeight: String(ex.defaultWeight ?? 0).replace('.', ','),
          restSeconds: String(ex.restSeconds ?? 90),
          durationMinutes: String(Math.round((ex.durationSeconds ?? 600) / 60)),
          notes: ex.notes ?? '',
        });
        setLoadState('ready');
        return;
      }

      if (!exerciseId) {
        if (!cancelled) setLoadState('missing');
        return;
      }

      // Deep link / page reload: location.state is lost, so resolve the
      // program and session that own this exercise from the database.
      if (!pId || !sId) {
        const programs = await programRepo.getAll();
        for (const p of programs) {
          const session = p.sessions.find((s) => s.exercises.some((e) => e.id === exerciseId));
          if (session) {
            pId = p.id;
            sId = session.id;
            break;
          }
        }
        if (!pId || !sId) {
          if (!cancelled) setLoadState('missing');
          return;
        }
        if (cancelled) return;
        setProgramId(pId);
        setSessionId(sId);
      }

      // Load from DB
      const prog = await programRepo.getById(pId);
      const session = prog?.sessions.find((s) => s.id === sId);
      const ex = session?.exercises.find((e) => e.id === exerciseId);
      if (cancelled) return;
      if (!ex) {
        setLoadState('missing');
        return;
      }

      setForm({
        name: ex.name,
        type: ex.type,
        sets: String(ex.sets ?? 3),
        targetReps: String(ex.targetReps ?? 8),
        defaultWeight: String(ex.defaultWeight ?? 0).replace('.', ','),
        restSeconds: String(ex.restSeconds ?? 90),
        durationMinutes: String(Math.round((ex.durationSeconds ?? 600) / 60)),
        notes: ex.notes ?? '',
      });
      setLoadState('ready');
    };
    void load();

    return () => {
      cancelled = true;
    };
  }, [exerciseId, state]);

  const set = (key: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) errs.name = 'Il nome è obbligatorio';
    if (form.type === 'strength') {
      const sets = Number.parseInt(form.sets, 10);
      const reps = Number.parseInt(form.targetReps, 10);
      if (!Number.isFinite(sets) || sets < 1) errs.sets = 'Minimo 1 serie';
      if (!Number.isFinite(reps) || reps < 1) errs.targetReps = 'Minimo 1 ripetizione';
      if (Number.isNaN(parseFloat(form.defaultWeight.replace(',', '.'))))
        errs.defaultWeight = 'Peso non valido';
    } else {
      const minutes = Number.parseInt(form.durationMinutes, 10);
      if (!Number.isFinite(minutes) || minutes < 1) {
        errs.durationMinutes = 'Minimo 1 minuto';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !programId || !sessionId) return;
    setIsSaving(true);

    const exercise: ExerciseTemplate = {
      id: exerciseId ?? generateId(),
      name: form.name.trim(),
      type: form.type,
      order: 0,
      sets: form.type === 'strength' ? parseInt(form.sets) || 3 : undefined,
      targetReps: form.type === 'strength' ? parseInt(form.targetReps) || 8 : undefined,
      defaultWeight:
        form.type === 'strength' ? parseWeight(form.defaultWeight) || 0 : undefined,
      restSeconds: form.type === 'strength' ? parseInt(form.restSeconds) || 90 : undefined,
      durationSeconds: form.type === 'cardio' ? (parseInt(form.durationMinutes) || 10) * 60 : undefined,
      notes: form.notes.trim() || undefined,
    };

    await programRepo.updateExercise(programId, sessionId, exercise);
    setIsSaving(false);
    navigate(-1);
  };

  const handleDelete = async () => {
    if (!programId || !sessionId || !exerciseId) return;
    await programRepo.deleteExercise(programId, sessionId, exerciseId);
    setShowDeleteConfirm(false);
    navigate(-1);
  };

  const restMinutes = Math.floor(parseInt(form.restSeconds || '0') / 60);
  const restSecs = parseInt(form.restSeconds || '0') % 60;

  if (loadState === 'loading') {
    return (
      <AppShell showNav={false}>
        <ScreenHeader title={strings.editExercise.title} showBack titleSize="lg" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (loadState === 'missing') {
    return (
      <AppShell showNav={false}>
        <ScreenHeader title={strings.editExercise.title} showBack titleSize="lg" />
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title={strings.editExercise.notFoundTitle}
            description={strings.editExercise.notFoundDetail}
            action={
              <Button variant="secondary" onClick={() => navigate(-1)}>
                {strings.actions.back}
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={form.name || 'Esercizio'}
        showBack
        titleSize="lg"
      />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="ex-name" className={labelClass}>
              {strings.editExercise.name}
            </label>
            <input
              id="ex-name"
              type="text"
              value={form.name}
              onChange={(e) => set('name')(e.target.value)}
              placeholder="Es: Chest Press"
              className={`${inputClass} ${errors.name ? 'border-danger' : ''}`}
            />
            {errors.name && (
              <p className="text-meta text-danger mt-1">{errors.name}</p>
            )}
          </div>

          {/* Type Toggle */}
          <div>
            <label className={labelClass}>Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              {(['strength', 'cardio'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => set('type')(t)}
                  className={`h-12 rounded-xl border text-[15px] font-semibold transition-all ${
                    form.type === t
                      ? 'bg-white text-black border-white'
                      : 'bg-white/[0.04] text-text-secondary border-white/10 hover:text-text-primary'
                  }`}
                >
                  {t === 'strength' ? 'Forza' : 'Cardio'}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'strength' ? (
            <>
              {/* Sets & Reps */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="ex-sets" className={labelClass}>
                    {strings.editExercise.sets}
                  </label>
                  <input
                    id="ex-sets"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={form.sets}
                    onChange={(e) => set('sets')(e.target.value)}
                    className={`${inputClass} ${errors.sets ? 'border-danger' : ''}`}
                  />
                  {errors.sets && (
                    <p className="text-meta text-danger mt-1">{errors.sets}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="ex-reps" className={labelClass}>
                    {strings.editExercise.reps}
                  </label>
                  <input
                    id="ex-reps"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100}
                    value={form.targetReps}
                    onChange={(e) => set('targetReps')(e.target.value)}
                    className={`${inputClass} ${errors.targetReps ? 'border-danger' : ''}`}
                  />
                  {errors.targetReps && (
                    <p className="text-meta text-danger mt-1">{errors.targetReps}</p>
                  )}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label htmlFor="ex-weight" className={labelClass}>
                  {strings.editExercise.weight}
                </label>
                <div className="relative">
                  <input
                    id="ex-weight"
                    type="text"
                    inputMode="decimal"
                    value={form.defaultWeight}
                    onChange={(e) => set('defaultWeight')(e.target.value)}
                    className={`${inputClass} pr-12 ${errors.defaultWeight ? 'border-danger' : ''}`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary text-meta">
                    kg
                  </span>
                </div>
                {errors.defaultWeight && (
                  <p className="text-meta text-danger mt-1">{errors.defaultWeight}</p>
                )}
              </div>

              {/* Rest */}
              <div>
                <label htmlFor="ex-rest" className={labelClass}>
                  {strings.editExercise.rest} ({restMinutes}m {restSecs > 0 ? `${restSecs}s` : ''})
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[60, 90, 120, 150].map((s) => (
                    <button
                      key={s}
                      onClick={() => set('restSeconds')(String(s))}
                      className={`h-12 rounded-xl text-meta font-semibold border transition-all ${
                        parseInt(form.restSeconds) === s
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.04] text-text-secondary border-white/10 hover:text-text-primary'
                      }`}
                    >
                      {s === 60 ? '1:00' : s === 90 ? '1:30' : s === 120 ? '2:00' : '2:30'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Cardio duration */
            <div>
              <label htmlFor="ex-duration" className={labelClass}>
                Durata (minuti)
              </label>
              <input
                id="ex-duration"
                type="number"
                inputMode="numeric"
                min={1}
                max={240}
                value={form.durationMinutes}
                onChange={(e) => set('durationMinutes')(e.target.value)}
                className={inputClass}
              />
              <p className="text-meta text-text-secondary mt-1">
                = {(parseInt(form.durationMinutes || '1') || 1) * 60} secondi
              </p>
              {errors.durationMinutes && (
                <p className="text-meta text-danger mt-1">{errors.durationMinutes}</p>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="ex-notes" className={labelClass}>
              {strings.editExercise.notes}
            </label>
            <textarea
              id="ex-notes"
              value={form.notes}
              onChange={(e) => set('notes')(e.target.value)}
              placeholder="Note, cues tecnici..."
              rows={3}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-4 text-text-primary text-body focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none transition-all placeholder:text-text-secondary/50 resize-none"
            />
          </div>

          {/* Delete Button */}
          {exerciseId && !state?.isNew && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full min-h-[48px] text-center text-danger text-meta font-semibold py-4 hover:underline"
            >
              {strings.editExercise.delete}
            </button>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto px-4 pb-8 pt-4 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-20">
        <Button variant="primary" fullWidth isLoading={isSaving} onClick={handleSave}>
          {strings.editExercise.save}
        </Button>
      </div>

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title={strings.editExercise.confirmDelete}
          description={strings.editExercise.confirmDeleteDetail}
          confirmLabel={strings.actions.delete}
          cancelLabel={strings.actions.cancel}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
          isDanger
        />
      )}
    </AppShell>
  );
};
