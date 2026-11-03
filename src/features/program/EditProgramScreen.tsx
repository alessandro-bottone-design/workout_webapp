/* ============================================
   EDIT PROGRAM SCREEN
   Edit program name, duration in weeks, start date,
   and manage sessions (reorder, add, rename, delete)
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ArrowUp, ArrowDown, ChevronRight, Check } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, ConfirmDialog, NumericStepper, EmptyState, GlassCard } from '@/components/ui';
import { programRepo } from '@/db/repositories';
import { generateId } from '@/lib/ids';
import { strings } from '@/lib/strings';
import type { Program, SessionTemplate } from '@/types';

export const EditProgramScreen: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();

  const [program, setProgram] = useState<Program | null>(null);
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(8);
  const [startDate, setStartDate] = useState('');
  const [sessions, setSessions] = useState<SessionTemplate[]>([]);
  const [deleteSessionTarget, setDeleteSessionTarget] = useState<SessionTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const prog = programId ? await programRepo.getById(programId) : await programRepo.getFirst();
      if (prog) {
        setProgram(prog);
        setName(prog.name);
        setDurationWeeks(prog.durationWeeks);
        setStartDate(
          prog.startDate ?? new Date(prog.createdAt).toISOString().slice(0, 10)
        );
        setSessions([...prog.sessions].sort((a, b) => a.order - b.order));
      }
      setIsLoading(false);
    };
    void load();
  }, [programId]);

  if (isLoading) {
    return (
      <AppShell showNav={false}>
        <ScreenHeader title={strings.program.editProgramLabel} showBack onBack={() => navigate('/program')} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!program) {
    return (
      <AppShell showNav={false}>
        <ScreenHeader title={strings.program.editProgramLabel} showBack onBack={() => navigate('/program')} />
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title="Scheda non trovata"
            description="La scheda richiesta non esiste o è stata eliminata."
            action={
              <Button variant="secondary" onClick={() => navigate('/program')}>
                Torna alla scheda
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const handleMoveSession = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sessions.length) return;

    const reordered = [...sessions];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const updated = reordered.map((s, idx) => ({ ...s, order: idx }));
    setSessions(updated);
  };

  const handleRenameSession = (id: string, newName: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  const handleAddSession = () => {
    const newSession: SessionTemplate = {
      id: generateId(),
      name: `Seduta ${String.fromCharCode(65 + sessions.length)}`,
      order: sessions.length,
      exercises: [],
    };
    setSessions([...sessions, newSession]);
  };

  const handleDeleteSessionConfirm = () => {
    if (!deleteSessionTarget) return;
    const remaining = sessions
      .filter((s) => s.id !== deleteSessionTarget.id)
      .map((s, idx) => ({ ...s, order: idx }));
    setSessions(remaining);
    setDeleteSessionTarget(null);
  };

  const handleSave = async () => {
    if (!program || isSaving) return;
    setIsSaving(true);
    try {
      const updatedProgram: Program = {
        ...program,
        name: name.trim() || 'Scheda Allenamento',
        durationWeeks,
        startDate: startDate || undefined,
        sessions,
      };
      await programRepo.update(updatedProgram);
      navigate('/program');
    } catch (err) {
      console.error('Failed to save program:', err);
      setIsSaving(false);
    }
  };

  return (
    <AppShell showNav={false}>
      <ScreenHeader
        title={strings.program.editProgramLabel}
        showBack
        onBack={() => navigate('/program')}
      />

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="px-4 pt-4 space-y-6">
          {/* Metadata Section */}
          <GlassCard className="p-4 space-y-4">
            <div>
              <label htmlFor="program-name" className="block text-label-sm text-text-secondary mb-2">
                Nome della scheda
              </label>
              <input
                id="program-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nome scheda"
                className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl px-4 text-body text-text-primary focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>

            <div>
              <label htmlFor="program-start-date" className="block text-label-sm text-text-secondary mb-2">
                Data di inizio
              </label>
              <input
                id="program-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 bg-white/[0.04] border border-white/10 rounded-xl px-4 text-body text-text-primary focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>

            <div className="pt-2">
              <NumericStepper
                value={durationWeeks}
                onChange={setDurationWeeks}
                min={1}
                max={52}
                label="Durata (settimane)"
              />
            </div>
          </GlassCard>

          {/* Sessions List Section */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-label-sm text-text-secondary font-semibold">Sedute in programma</p>
              <span className="text-meta text-text-secondary">
                {sessions.length} {sessions.length === 1 ? 'seduta' : 'sedute'}
              </span>
            </div>

            <div className="space-y-4">
              {sessions.map((sess, idx) => (
                <motion.div
                  key={sess.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.04] rounded-2xl border border-white/10 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-meta font-semibold text-text-primary">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={sess.name}
                      onChange={(e) => handleRenameSession(sess.id, e.target.value)}
                      aria-label={`Nome seduta ${idx + 1}`}
                      className="flex-1 bg-transparent border-b border-transparent hover:border-white/10 focus:border-white/40 text-[15px] font-semibold text-text-primary px-2 py-1 focus:outline-none transition-colors"
                    />

                    {/* Move up / down */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSession(idx, 'up')}
                      aria-label={`Sposta su ${sess.name}`}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary disabled:opacity-20 hover:text-text-primary rounded-full hover:bg-white/10 transition-colors"
                    >
                      <ArrowUp className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sessions.length - 1}
                      onClick={() => handleMoveSession(idx, 'down')}
                      aria-label={`Sposta giù ${sess.name}`}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary disabled:opacity-20 hover:text-text-primary rounded-full hover:bg-white/10 transition-colors"
                    >
                      <ArrowDown className="w-4 h-4" strokeWidth={1.75} />
                    </button>

                    {/* Delete session */}
                    <button
                      type="button"
                      disabled={sessions.length <= 1}
                      onClick={() => setDeleteSessionTarget(sess)}
                      aria-label={`Elimina ${sess.name}`}
                      className="w-10 h-10 flex items-center justify-center text-text-secondary hover:text-danger disabled:opacity-20 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-meta text-text-secondary">
                      {sess.exercises.length} esercizi
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/program/session/${sess.id}/edit`)}
                      className="text-meta text-white/80 hover:text-white font-semibold flex items-center gap-1 hover:underline"
                    >
                      Modifica esercizi
                      <ChevronRight className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>
                </motion.div>
              ))}

              <Button
                variant="secondary"
                fullWidth
                onClick={handleAddSession}
                className="mt-2"
              >
                <Plus className="w-4 h-4 mr-2" strokeWidth={1.75} />
                Aggiungi seduta
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Save Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto p-4 pb-8 bg-black/80 backdrop-blur-2xl border-t border-white/10 z-20">
        <Button variant="primary" fullWidth isLoading={isSaving} onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" strokeWidth={1.75} />
          Salva modifiche
        </Button>
      </div>

      {/* Delete session confirm dialog */}
      <AnimatePresence>
        {deleteSessionTarget && (
          <ConfirmDialog
            isOpen={deleteSessionTarget !== null}
            title={`Eliminare ${deleteSessionTarget.name}?`}
            description="Questa operazione rimuoverà la seduta e tutti i suoi esercizi dalla scheda. Lo storico dei workout completati non verrà eliminato."
            confirmLabel="Elimina seduta"
            cancelLabel="Annulla"
            onConfirm={handleDeleteSessionConfirm}
            onCancel={() => setDeleteSessionTarget(null)}
            isDanger
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
};
