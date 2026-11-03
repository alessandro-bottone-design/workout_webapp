/* ============================================
   MY PROGRAM SCREEN
   Shows session list and program metadata
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Pencil, Plus, RotateCcw } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, EmptyState, IconButton, GlassCard } from '@/components/ui';
import { programRepo, workoutRepo } from '@/db/repositories';
import { getNextSessionId, getCurrentProgramWeek } from '@/lib/selectors';
import { useTabSync } from '@/lib/tabSync';
import { strings } from '@/lib/strings';
import type { Program, Workout } from '@/types';

export const ProgramScreen: React.FC = () => {
  const navigate = useNavigate();
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [completedWorkouts, setCompletedWorkouts] = useState<Workout[]>([]);
  const [nextSessionId, setNextSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const [all, activeProg, workouts] = await Promise.all([
      programRepo.getAll(),
      programRepo.getActive(),
      workoutRepo.getCompleted(),
    ]);
    setAllPrograms(all);
    setProgram(activeProg ?? all[0] ?? null);
    setCompletedWorkouts(workouts);
    if (activeProg) {
      const nextId = getNextSessionId(activeProg.sessions, workouts);
      setNextSessionId(nextId ?? null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useTabSync(() => {
    void loadData();
  });

  const handleSwitchProgram = async (progId: string) => {
    await programRepo.setActive(progId);
    void loadData();
  };

  const handleCreateProgram = async () => {
    const newProg = await programRepo.create(`Nuova Scheda ${allPrograms.length + 1}`, 8);
    await programRepo.setActive(newProg.id);
    navigate(`/program/${newProg.id}/edit`);
  };

  const handleRestartProgram = async () => {
    if (!program) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const updated: Program = {
      ...program,
      startDate: todayStr,
    };
    await programRepo.update(updated);
    setProgram(updated);
  };

  if (isLoading) {
    return (
      <AppShell>
        <ScreenHeader title={strings.program.title} variant="display" titleSize="md" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (!program) {
    return (
      <AppShell>
        <ScreenHeader title={strings.program.title} variant="display" titleSize="md" />
        <div className="flex-1 flex items-center justify-center px-4">
          <EmptyState
            title={strings.program.noProgram}
            description={strings.program.createProgramDetail}
            action={
              <Button variant="primary" onClick={handleCreateProgram}>
                {strings.program.createProgram}
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  const rawWeek = getCurrentProgramWeek(
    program.startDate ?? new Date(program.createdAt).toISOString()
  );
  const isCompleted = rawWeek > program.durationWeeks;
  const clampedWeek = Math.min(rawWeek, program.durationWeeks);
  const sortedSessions = [...program.sessions].sort((a, b) => a.order - b.order);

  return (
    <AppShell>
      <ScreenHeader
        title={strings.program.title}
        variant="display"
        titleSize="md"
        rightAction={
          <IconButton
            label={strings.program.editProgramLabel}
            onClick={() => navigate(`/program/${program.id}/edit`)}
          >
            <Pencil className="w-5 h-5" strokeWidth={1.75} />
          </IconButton>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 space-y-4 pt-4">
          {/* Multi-Program Switcher */}
          {allPrograms.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
              {allPrograms.map((p) => {
                const isActive = p.id === program.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchProgram(p.id)}
                    className={`h-10 px-4 rounded-full text-meta whitespace-nowrap transition-colors border flex items-center ${
                      isActive
                        ? 'bg-white text-black border-white font-semibold'
                        : 'bg-white/[0.06] text-text-secondary border-white/10 hover:text-text-primary'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
              <button
                onClick={handleCreateProgram}
                aria-label="Crea nuova scheda"
                className="h-10 px-4 rounded-full text-meta whitespace-nowrap bg-white/[0.04] text-text-primary border border-white/10 hover:bg-white/10 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-4 h-4" strokeWidth={1.75} />
                Nuova
              </button>
            </div>
          )}

          {/* Program Header Glass Card */}
          <GlassCard className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-heading text-text-primary font-semibold">{program.name}</h2>
                <p className="text-meta text-text-secondary mt-1">
                  {strings.program.current}
                </p>
              </div>
              {allPrograms.length === 1 && (
                <button
                  type="button"
                  onClick={handleCreateProgram}
                  className="h-10 px-4 text-meta text-white/80 hover:text-white font-semibold flex items-center gap-1 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-4 h-4" strokeWidth={1.75} />
                  Nuova
                </button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (clampedWeek / program.durationWeeks) * 100)}%`,
                  }}
                />
              </div>
              <span className="text-meta text-text-secondary whitespace-nowrap tabular-nums">
                {strings.program.weeks(clampedWeek, program.durationWeeks)}
              </span>
            </div>

            {/* Completed Program State Banner */}
            {isCompleted && (
              <div className="p-4 rounded-2xl bg-white/[0.08] border border-white/15 flex items-center justify-between gap-4">
                <div>
                  <p className="text-label-sm text-text-primary font-semibold">
                    Programma completato
                  </p>
                  <p className="text-meta text-text-secondary mt-1">
                    Hai completato le {program.durationWeeks} settimane previste.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRestartProgram}
                  className="h-10 px-4 rounded-full bg-white text-black font-semibold text-meta flex items-center gap-2 hover:bg-white/90 transition-opacity flex-shrink-0"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.75} />
                  Ricomincia
                </button>
              </div>
            )}
          </GlassCard>

          {/* Sessions */}
          <div>
            <p className="text-label-sm text-text-secondary mb-4 px-1">{strings.program.sessionsSection}</p>
            <div className="space-y-2">
              {sortedSessions.map((session, idx) => {
                const isNext = session.id === nextSessionId;
                const completedForSession = completedWorkouts.filter(
                  (w) => w.sessionTemplateId === session.id
                ).length;

                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <button
                      onClick={() => navigate(`/program/session/${session.id}`)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all duration-200 ${
                        isNext
                          ? 'bg-white/[0.08] border-white/30 backdrop-blur-xl'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05] backdrop-blur-lg'
                      }`}
                    >
                      {/* Session number */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-[15px] font-semibold ${
                          isNext
                            ? 'bg-white text-black'
                            : 'bg-white/10 text-text-secondary'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-semibold text-text-primary">
                            {session.name}
                          </p>
                          {isNext && (
                            <span className="text-[12px] text-white/80 font-semibold px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                              Prossima
                            </span>
                          )}
                        </div>
                        <p className="text-meta text-text-secondary mt-1">
                          {session.exercises.length} esercizi
                          {completedForSession > 0
                            ? ` · ${completedForSession} volte`
                            : ''}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-text-secondary flex-shrink-0" strokeWidth={1.75} />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Edit Button */}
          <div className="pt-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => navigate(`/program/${program.id}/edit`)}
            >
              {strings.program.editProgram}
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
