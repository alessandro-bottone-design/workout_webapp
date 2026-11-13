/* ============================================
   CALENDAR SCREEN
   Monthly calendar with workout & Google Calendar indicators
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  CalendarDays,
  RefreshCw,
  MapPin,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { AppShell, ScreenHeader } from '@shared/components/layout';
import { Button, GlassCard, IconButton } from '@shared/components/ui';
import { workoutRepo, programRepo } from '@shared/db/repositories';
import { getWorkoutDays, getWorkoutsOnDay, getNextSessionId } from '@shared/lib/selectors';
import { formatMonthYear, formatDate, formatDuration, startOfDay } from '@shared/lib/formatters';
import { eventDaySet, eventsOnDay, type CalendarEvent } from '@features/calendar/ical';
import { useGoogleCalendarStore } from '@features/calendar/googleCalendarStore';
import { PlanWorkoutSheet } from '@features/calendar/PlanWorkoutSheet';
import { strings } from '@shared/lib/strings';
import { useTabSync } from '@shared/lib/tabSync';
import type { Program, Workout } from '@shared/types';

const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getMondayOffset(year: number, month: number): number {
  const firstDay = new Date(year, month, 1).getDay();
  // JS: 0=Sun, 1=Mon... We want Monday=0
  return firstDay === 0 ? 6 : firstDay - 1;
}

const timeFmt = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' });
const shortDayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return 'Tutto il giorno';
  return `${timeFmt.format(event.start)} – ${timeFmt.format(event.end)}`;
}

export const CalendarScreen: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [program, setProgram] = useState<Program | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [showPlanSheet, setShowPlanSheet] = useState(false);

  const {
    isConnected,
    calendarName,
    events: googleEvents,
    isSyncing,
    error: googleError,
    refresh: refreshGoogle,
  } = useGoogleCalendarStore();

  const loadData = useCallback(() => {
    void Promise.all([workoutRepo.getAll(), programRepo.getActive()]).then(([ws, prog]) => {
      setWorkouts(ws);
      setProgram(prog ?? null);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    void useGoogleCalendarStore.getState().bootstrap();
  }, []);

  useTabSync(loadData);

  const workoutDays = useMemo(() => getWorkoutDays(workouts), [workouts]);
  const googleEventDays = useMemo(() => eventDaySet(googleEvents), [googleEvents]);
  const days = useMemo(() => getDaysInMonth(viewYear, viewMonth), [viewYear, viewMonth]);
  const offset = getMondayOffset(viewYear, viewMonth);
  const today = startOfDay(Date.now());

  const completedWorkouts = useMemo(
    () => workouts.filter((w) => w.status === 'completed'),
    [workouts]
  );

  const recommendedSessionId = useMemo(() => {
    if (!program || program.sessions.length === 0) return null;
    return getNextSessionId(program.sessions, completedWorkouts) ?? program.sessions[0].id;
  }, [program, completedWorkouts]);

  const selectedWorkouts = selectedDay
    ? getWorkoutsOnDay(workouts, selectedDay)
    : [];

  const selectedGoogleEvents = useMemo(
    () => (selectedDay && isConnected ? eventsOnDay(googleEvents, selectedDay) : []),
    [selectedDay, isConnected, googleEvents]
  );

  const upcomingGoogleEvents = useMemo(() => {
    if (!isConnected) return [];
    const now = Date.now();
    return googleEvents.filter((e) => e.end >= now).slice(0, 4);
  }, [isConnected, googleEvents]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  return (
    <AppShell>
      <ScreenHeader
        title={strings.calendar.title}
        variant="display"
        titleSize="lg"
        rightAction={
          isConnected ? (
            <IconButton
              label="Aggiorna Google Calendar"
              onClick={() => void refreshGoogle({ force: true })}
              disabled={isSyncing}
            >
              <RefreshCw
                className={`w-5 h-5 text-text-secondary ${isSyncing ? 'animate-spin' : ''}`}
                strokeWidth={1.75}
              />
            </IconButton>
          ) : undefined
        }
      />

      <div className="flex-1 overflow-y-auto pb-nav">
        <div className="px-4 pt-4 space-y-4">
          {/* Month Navigation & Glass Calendar Panel */}
          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                aria-label={strings.calendar.prevMonth}
                className="w-12 h-12 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={1.75} />
              </button>
              <h2 className="text-heading text-text-primary capitalize font-semibold">
                {formatMonthYear(new Date(viewYear, viewMonth, 1).getTime())}
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                aria-label={strings.calendar.nextMonth}
                className="w-12 h-12 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-5 h-5" strokeWidth={1.75} />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS_IT.map((d) => (
                <div key={d} className="text-center py-1">
                  <span className="text-[12px] font-semibold text-text-secondary">{d}</span>
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-y-1">
              {/* Offset blank cells */}
              {Array.from({ length: offset }, (_, i) => (
                <div key={`blank-${i}`} />
              ))}

              {days.map((day) => {
                const dayTs = startOfDay(day.getTime());
                const hasWorkout = workoutDays.has(dayTs);
                const hasGoogleEvent = isConnected ? googleEventDays.has(dayTs) : false;
                const isToday = dayTs === today;
                const isSelected = dayTs === selectedDay;
                const isCurrentMonth = day.getMonth() === viewMonth;

                return (
                  <button
                    key={dayTs}
                    type="button"
                    onClick={() =>
                      setSelectedDay(isSelected ? null : dayTs)
                    }
                    aria-label={strings.calendar.dayLabel(day.getDate(), hasWorkout)}
                    aria-pressed={isSelected}
                    className={`relative flex flex-col items-center justify-center w-11 h-11 rounded-full mx-auto transition-all duration-150 ${
                      isSelected
                        ? 'bg-white text-black font-semibold'
                        : isToday
                        ? 'bg-white/10 border border-white/40 text-text-primary'
                        : 'text-text-primary hover:bg-white/10'
                    } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                  >
                    <span className="text-[15px] font-semibold tabular-nums">
                      {day.getDate()}
                    </span>
                    {(hasWorkout || hasGoogleEvent) && (
                      <div className="absolute bottom-1 flex items-center gap-1">
                        {hasWorkout && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-black' : 'bg-white'
                            }`}
                          />
                        )}
                        {hasGoogleEvent && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? 'bg-black/45' : 'bg-white/45'
                            }`}
                          />
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle legend when Google Calendar is linked */}
            {isConnected && (
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-center gap-6 text-[12px] text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                  Allenamento
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white/45" />
                  {calendarName || 'Google Calendar'}
                </span>
              </div>
            )}
          </GlassCard>

          {/* Sync warning if offline or feed error */}
          {isConnected && googleError && (
            <GlassCard className="p-3 flex items-center gap-3 border-white/15">
              <AlertCircle className="w-4 h-4 text-text-secondary flex-shrink-0" strokeWidth={1.75} />
              <p className="text-meta text-text-secondary flex-1 min-w-0">{googleError}</p>
            </GlassCard>
          )}

          {/* Selected Day Details */}
          {selectedDay ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between px-1 gap-2">
                <p className="text-label-sm text-text-secondary font-semibold truncate">
                  {formatDate(selectedDay)}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPlanSheet(true)}
                  className="min-h-[44px] px-3 -my-2 rounded-full text-meta font-semibold text-text-primary hover:bg-white/10 flex items-center gap-1.5 flex-shrink-0 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" strokeWidth={1.75} />
                  Pianifica
                </button>
              </div>

              {selectedWorkouts.length > 0 && (
                <div className="space-y-3">
                  {selectedWorkouts.map((w) => (
                    <GlassCard
                      key={w.id}
                      onClick={() => navigate(`/workout/${w.id}`)}
                      className="p-4 cursor-pointer hover:border-white/30 transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <h3 className="text-[15px] font-semibold text-text-primary truncate">
                          {w.sessionNameSnapshot}
                        </h3>
                        <span className="text-[12px] font-semibold text-white/80 px-2 py-0.5 rounded-full bg-white/10 border border-white/15 flex-shrink-0">
                          {strings.calendar.completed}
                        </span>
                      </div>
                      <p className="text-meta text-text-secondary mt-1">
                        {w.completedAt
                          ? formatDuration(w.completedAt - w.startedAt)
                          : '—'}
                        {' · '}
                        {
                          w.exerciseLogs.filter((e) => e.status === 'completed')
                            .length
                        }{' '}
                        esercizi
                      </p>
                    </GlassCard>
                  ))}
                </div>
              )}

              {selectedGoogleEvents.length > 0 && (
                <div className="space-y-2">
                  {selectedGoogleEvents.map((ev) => (
                    <GlassCard key={ev.id} className="p-4 text-left">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 text-[12px] text-text-secondary tabular-nums">
                            <Clock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                            <span>{formatEventTime(ev)}</span>
                          </div>
                          <p className="text-[15px] font-semibold text-text-primary mt-1 break-words">
                            {ev.title}
                          </p>
                          {ev.location && (
                            <p className="text-meta text-text-secondary mt-1 flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={1.75} />
                              <span className="truncate">{ev.location}</span>
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-text-secondary px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/10 flex-shrink-0">
                          Google
                        </span>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}

              {selectedWorkouts.length === 0 && selectedGoogleEvents.length === 0 && (
                <GlassCard className="p-4 text-center space-y-3">
                  <p className="text-meta text-text-secondary">
                    {strings.calendar.noWorkout}
                  </p>
                </GlassCard>
              )}
            </motion.div>
          ) : isConnected ? (
            /* Connected, no day tapped yet -> upcoming events + quick plan */
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-label-sm text-text-secondary font-semibold">
                  Prossimi impegni · {calendarName || 'Google Calendar'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowPlanSheet(true)}
                  className="min-h-[44px] px-3 -my-2 rounded-full text-meta font-semibold text-text-primary hover:bg-white/10 flex items-center gap-1.5 flex-shrink-0 transition-colors"
                >
                  <CalendarPlus className="w-4 h-4" strokeWidth={1.75} />
                  Pianifica
                </button>
              </div>

              {upcomingGoogleEvents.length > 0 ? (
                <div className="space-y-2">
                  {upcomingGoogleEvents.map((ev) => (
                    <GlassCard key={ev.id} className="p-4 text-left">
                      <div className="flex items-center justify-between gap-2 text-[12px] text-text-secondary">
                        <span className="capitalize font-semibold">{shortDayFmt.format(ev.start)}</span>
                        <span className="tabular-nums">{formatEventTime(ev)}</span>
                      </div>
                      <p className="text-[15px] font-semibold text-text-primary mt-1 truncate">
                        {ev.title}
                      </p>
                    </GlassCard>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-4 text-center">
                  <p className="text-meta text-text-secondary">
                    Nessun impegno in arrivo su Google Calendar. Tocca un giorno per i dettagli.
                  </p>
                </GlassCard>
              )}
            </div>
          ) : (
            /* Not connected -> invite card + quick Google Calendar event button */
            <GlassCard className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-white" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-body font-semibold text-text-primary">
                    Collega Google Calendar
                  </h3>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Mostra qui i tuoi impegni e pianifica le sedute di allenamento.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-12"
                  onClick={() => setShowPlanSheet(true)}
                >
                  <CalendarPlus className="w-4 h-4 mr-1.5" strokeWidth={1.75} />
                  Pianifica
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-12"
                  onClick={() => navigate('/settings#google-calendar')}
                >
                  Collega
                </Button>
              </div>
            </GlassCard>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showPlanSheet && (
          <PlanWorkoutSheet
            initialDayMs={selectedDay ?? today}
            sessions={program?.sessions ?? []}
            defaultSessionId={recommendedSessionId}
            onClose={() => setShowPlanSheet(false)}
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
};
