/* ============================================
   CALENDAR SCREEN
   Monthly calendar with workout day indicators
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { GlassCard } from '@/components/ui';
import { workoutRepo } from '@/db/repositories';
import { getWorkoutDays, getWorkoutsOnDay } from '@/lib/selectors';
import { formatMonthYear, formatDate, formatDuration, startOfDay } from '@/lib/formatters';
import { strings } from '@/lib/strings';
import { useTabSync } from '@/lib/tabSync';
import type { Workout } from '@/types';

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

export const CalendarScreen: React.FC = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());

  const loadWorkouts = useCallback(() => {
    void workoutRepo.getAll().then(setWorkouts);
  }, []);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  useTabSync(loadWorkouts);

  const workoutDays = getWorkoutDays(workouts);
  const days = getDaysInMonth(viewYear, viewMonth);
  const offset = getMondayOffset(viewYear, viewMonth);
  const today = startOfDay(Date.now());

  const selectedWorkouts = selectedDay
    ? getWorkoutsOnDay(workouts, selectedDay)
    : [];

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
      <ScreenHeader title={strings.calendar.title} variant="display" titleSize="lg" />

      <div className="flex-1 overflow-y-auto pb-24">
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
                    {hasWorkout && (
                      <div
                        className={`absolute bottom-1 w-1 h-1 rounded-full ${
                          isSelected ? 'bg-black' : 'bg-white'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </GlassCard>

          {/* Selected Day Details */}
          {selectedDay && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-label-sm text-text-secondary px-1 font-semibold">
                {formatDate(selectedDay)}
              </p>
              {selectedWorkouts.length > 0 ? (
                <div className="space-y-4">
                  {selectedWorkouts.map((w) => (
                    <GlassCard
                      key={w.id}
                      onClick={() => navigate(`/workout/${w.id}`)}
                      className="p-4 cursor-pointer hover:border-white/30 transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[15px] font-semibold text-text-primary">
                          {w.sessionNameSnapshot}
                        </h3>
                        <span className="text-[12px] font-semibold text-white/80 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
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
              ) : (
                <GlassCard className="p-4 text-center">
                  <p className="text-meta text-text-secondary">
                    {strings.calendar.noWorkout}
                  </p>
                </GlassCard>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
