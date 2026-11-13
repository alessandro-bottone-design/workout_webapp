/* ============================================
   PLAN WORKOUT SHEET — Pianifica su Google Calendar
   Apple visionOS Bottom Sheet · 8px Grid · 48px Touch
   ============================================ */

import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, ExternalLink, X } from 'lucide-react';
import { Button, IconButton } from '@shared/components/ui';
import { useDialogA11y } from '@shared/lib/useDialogA11y';
import { openGoogleCalendarEvent } from '@features/calendar/googleCalendar';
import type { SessionTemplate } from '@shared/types';

interface PlanWorkoutSheetProps {
  initialDayMs: number;
  sessions: SessionTemplate[];
  defaultSessionId?: string | null;
  onClose: () => void;
}

const DURATION_OPTIONS = [45, 60, 75, 90] as const;

function toDateInputValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultTimeForDay(dayMs: number): string {
  const now = new Date();
  const target = new Date(dayMs);
  const isToday =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate();

  if (!isToday) return '18:00';
  const nextHour = Math.min(21, Math.max(7, now.getHours() + 1));
  return `${String(nextHour).padStart(2, '0')}:00`;
}

function buildSessionDetails(session: SessionTemplate | undefined): string {
  if (!session || session.exercises.length === 0) return 'Allenamento registrato da Workout Lab.';
  const lines = session.exercises.map((ex) => {
    if (ex.type === 'strength' && ex.sets) {
      const weight = ex.defaultWeight ? ` · ${ex.defaultWeight} kg` : '';
      return `• ${ex.name} (${ex.sets} × ${ex.targetReps ?? '—'}${weight})`;
    }
    const mins = Math.round((ex.durationSeconds ?? 0) / 60);
    return `• ${ex.name}${mins > 0 ? ` (${mins} min)` : ''}`;
  });
  return `${session.name}\n\n${lines.join('\n')}`;
}

export const PlanWorkoutSheet: React.FC<PlanWorkoutSheetProps> = ({
  initialDayMs,
  sessions,
  defaultSessionId,
  onClose,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, onClose, sheetRef);

  const sortedSessions = useMemo(
    () => [...sessions].sort((a, b) => a.order - b.order),
    [sessions]
  );

  const [selectedSessionId, setSelectedSessionId] = useState<string>(
    defaultSessionId ?? sortedSessions[0]?.id ?? ''
  );
  const [dateStr, setDateStr] = useState<string>(() => toDateInputValue(initialDayMs));
  const [timeStr, setTimeStr] = useState<string>(() => defaultTimeForDay(initialDayMs));
  const [durationMin, setDurationMin] = useState<number>(75);

  const selectedSession = sortedSessions.find((s) => s.id === selectedSessionId) ?? sortedSessions[0];

  const handleOpenGoogle = () => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    if (!y || !m || !d) return;

    const start = new Date(y, m - 1, d, Number.isFinite(hh) ? hh : 18, Number.isFinite(mm) ? mm : 0).getTime();
    const end = start + durationMin * 60_000;

    openGoogleCalendarEvent({
      title: selectedSession ? `Workout · ${selectedSession.name}` : 'Workout in palestra',
      start,
      end,
      details: buildSessionDetails(selectedSession),
    });
    onClose();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xl"
        onClick={onClose}
      />

      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-workout-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-[#161618]/95 backdrop-blur-3xl rounded-t-modal border-t border-white/[0.12] p-6 pb-[max(24px,calc(16px+var(--safe-bottom)))] focus:outline-none shadow-2xl max-h-[88dvh] overflow-y-auto"
      >
        <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-white/[0.08] border border-white/[0.12] flex items-center justify-center flex-shrink-0">
              <CalendarPlus className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h2 id="plan-workout-title" className="text-heading font-semibold text-text-primary">
                Pianifica su Google Calendar
              </h2>
              <p className="text-meta text-text-secondary">
                Apre l&apos;evento pronto da salvare
              </p>
            </div>
          </div>
          <IconButton label="Chiudi" onClick={onClose} className="-mr-2 -mt-1">
            <X className="w-5 h-5 text-text-secondary" strokeWidth={1.75} />
          </IconButton>
        </div>

        <div className="py-4 space-y-4">
          {sortedSessions.length > 0 && (
            <div>
              <p className="text-label-sm text-text-secondary font-semibold mb-2">Seduta</p>
              <div className="grid grid-cols-2 gap-2">
                {sortedSessions.map((session) => {
                  const active = session.id === selectedSession?.id;
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedSessionId(session.id)}
                      className={`min-h-[48px] px-3 py-2 rounded-btn text-meta font-semibold border transition-all truncate ${
                        active
                          ? 'bg-white text-black border-white'
                          : 'bg-white/[0.04] text-text-secondary border-white/10 hover:text-text-primary'
                      }`}
                    >
                      {session.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="plan-date" className="text-label-sm text-text-secondary font-semibold mb-2 block">
                Giorno
              </label>
              <input
                id="plan-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full h-12 bg-white/[0.05] border border-white/10 rounded-xl px-3 text-body text-text-primary focus:outline-none focus:border-white/40 [color-scheme:dark]"
              />
            </div>
            <div>
              <label htmlFor="plan-time" className="text-label-sm text-text-secondary font-semibold mb-2 block">
                Ora inizio
              </label>
              <input
                id="plan-time"
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                className="w-full h-12 bg-white/[0.05] border border-white/10 rounded-xl px-3 text-body text-text-primary focus:outline-none focus:border-white/40 [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <p className="text-label-sm text-text-secondary font-semibold mb-2">Durata</p>
            <div className="grid grid-cols-4 gap-2">
              {DURATION_OPTIONS.map((min) => (
                <button
                  key={min}
                  type="button"
                  onClick={() => setDurationMin(min)}
                  className={`h-12 rounded-xl text-meta font-semibold border transition-all ${
                    durationMin === min
                      ? 'bg-white text-black border-white'
                      : 'bg-white/[0.04] text-text-secondary border-white/10 hover:text-text-primary'
                  }`}
                >
                  {min}m
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button variant="primary" fullWidth onClick={handleOpenGoogle}>
          <ExternalLink className="w-4 h-4 mr-2" strokeWidth={1.75} />
          Aggiungi a Google Calendar
        </Button>
      </motion.div>
    </>
  );
};
