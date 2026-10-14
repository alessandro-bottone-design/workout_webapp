/* ============================================
   SETTINGS SCREEN
   Timer defaults, sound, vibration, gym hours, data reset
   ============================================ */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Toggle, ConfirmDialog } from '@/components/ui';
import { settingsRepo, resetAllData } from '@/db/repositories';
import { seedDatabase, restoreDefaultProgram } from '@/db/seed';
import { useTimerStore } from '@/features/timer/timerStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { GYM_SCHEDULE, getGymStatus } from '@/lib/gymSchedule';
import { strings } from '@/lib/strings';
import type { AppSettings } from '@/types';

const REST_OPTIONS = [
  { label: '1:00', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2:00', value: 120 },
  { label: '2:30', value: 150 },
];

const sectionClass = 'bg-bg-surface rounded-card border border-border-default overflow-hidden';
const rowClass = 'flex items-center justify-between px-5 py-4 border-b border-border-default last:border-b-0';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultRestSeconds: 120,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRestoreProgramConfirm, setShowRestoreProgramConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [restoreDone, setRestoreDone] = useState(false);

  const gymStatus = getGymStatus();
  const todayDayOfWeek = new Date().getDay();

  useEffect(() => {
    void settingsRepo.get().then(setSettings);
  }, []);

  const updateSetting = async (patch: Partial<AppSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await settingsRepo.update(patch);
  };

  const handleReset = async () => {
    await resetAllData();
    // Clear any stale in-memory state referencing deleted records
    useTimerStore.setState({ timer: null });
    useWorkoutStore.getState().clearActiveWorkout();
    await seedDatabase();
    setShowResetConfirm(false);
    setResetDone(true);
    // Reload settings
    const fresh = await settingsRepo.get();
    setSettings(fresh);
  };

  const handleRestoreProgram = async () => {
    await restoreDefaultProgram();
    setShowRestoreProgramConfirm(false);
    setRestoreDone(true);
  };

  // Auto-dismiss the confirmation toasts. Keyed on the flag (not called from
  // the handlers) so the timer is always cleared if the screen unmounts first.
  useEffect(() => {
    if (!resetDone) return;
    const id = setTimeout(() => setResetDone(false), 3000);
    return () => clearTimeout(id);
  }, [resetDone]);

  useEffect(() => {
    if (!restoreDone) return;
    const id = setTimeout(() => setRestoreDone(false), 3000);
    return () => clearTimeout(id);
  }, [restoreDone]);

  return (
    <AppShell>
      <ScreenHeader title={strings.settings.title} variant="display" titleSize="lg" />

      <div className="flex-1 overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))]">
        <div className="px-5 pt-4 space-y-5">
          {/* Gym Schedule */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-label-sm text-text-secondary uppercase">ORARI PALESTRA</p>
              <span className="text-meta text-accent-primary font-semibold flex items-center gap-1.5">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    gymStatus.isOpen ? 'bg-accent-primary animate-pulse' : 'bg-text-secondary opacity-40'
                  }`}
                />
                {gymStatus.statusText}
              </span>
            </div>

            <div className={sectionClass}>
              <div className="p-5 space-y-3">
                {GYM_SCHEDULE.map((item) => {
                  const isToday = item.days.includes(todayDayOfWeek);
                  return (
                    <div
                      key={item.dayLabel}
                      className={`flex items-center justify-between text-meta py-1.5 px-3 rounded-btn ${
                        isToday
                          ? 'bg-accent-primary/10 text-accent-primary font-semibold'
                          : 'text-text-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${isToday ? 'text-accent-primary' : 'text-text-secondary'}`} />
                        <span>{item.dayLabel}</span>
                        {isToday && (
                          <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-accent-primary text-bg-app font-bold">
                            Oggi
                          </span>
                        )}
                      </div>
                      <span className={isToday ? 'text-accent-primary' : 'text-text-primary'}>
                        {item.hoursFormatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Timer default */}
          <div>
            <p className="text-label-sm text-text-secondary mb-3 px-1">TIMER</p>
            <div className={sectionClass}>
              <div className="px-5 pt-4 pb-3">
                <p className="text-body text-text-primary mb-3">
                  {strings.settings.defaultTimer}
                </p>
                <div
                  role="radiogroup"
                  aria-label={strings.settings.defaultTimer}
                  className="grid grid-cols-4 gap-2"
                >
                  {REST_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.value}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => void updateSetting({ defaultRestSeconds: opt.value })}
                      role="radio"
                      aria-checked={settings.defaultRestSeconds === opt.value}
                      className={`h-[44px] rounded-btn text-meta font-semibold border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
                        settings.defaultRestSeconds === opt.value
                          ? 'bg-accent-primary text-bg-app border-accent-primary'
                          : 'bg-bg-elevated text-text-secondary border-border-default'
                      }`}
                    >
                      {opt.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly target */}
          <div>
            <p className="text-label-sm text-text-secondary mb-3 px-1">OBIETTIVO</p>
            <div className={sectionClass}>
              <div className={rowClass}>
                <div className="pr-4">
                  <p className="text-body text-text-primary">Sessioni a settimana</p>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Quante allenamenti punti ogni settimana
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      void updateSetting({
                        weeklyTarget: Math.max(1, (settings.weeklyTarget ?? 4) - 1),
                      })
                    }
                    disabled={(settings.weeklyTarget ?? 4) <= 1}
                    aria-label="Riduci obiettivo settimanale"
                    className="w-11 h-11 rounded-btn flex items-center justify-center text-text-primary bg-bg-elevated border border-border-default disabled:opacity-40"
                  >
                    −
                  </motion.button>
                  <span className="w-10 text-center text-[20px] font-bold text-text-primary tabular-nums">
                    {settings.weeklyTarget ?? 4}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() =>
                      void updateSetting({
                        weeklyTarget: Math.min(14, (settings.weeklyTarget ?? 4) + 1),
                      })
                    }
                    disabled={(settings.weeklyTarget ?? 4) >= 14}
                    aria-label="Aumenta obiettivo settimanale"
                    className="w-11 h-11 rounded-btn flex items-center justify-center text-text-primary bg-bg-elevated border border-border-default disabled:opacity-40"
                  >
                    +
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-label-sm text-text-secondary mb-3 px-1">FEEDBACK</p>
            <div className={sectionClass}>
              <div className={rowClass}>
                <Toggle
                  label={strings.settings.sound}
                  checked={settings.soundEnabled}
                  onChange={(v) => void updateSetting({ soundEnabled: v })}
                />
              </div>
              <div className={rowClass}>
                <Toggle
                  label={strings.settings.vibration}
                  checked={settings.vibrationEnabled}
                  onChange={(v) => void updateSetting({ vibrationEnabled: v })}
                />
              </div>
            </div>
          </div>

          {/* Integrations */}
          <div>
            <p className="text-label-sm text-text-secondary mb-3 px-1">INTEGRAZIONI</p>
            <div className={sectionClass}>
              <div className={rowClass}>
                <span className="text-body text-text-primary">
                  {strings.settings.appleHealth}
                </span>
                <span className="text-meta text-text-secondary">
                  {strings.settings.appleHealthNote}
                </span>
              </div>
            </div>
          </div>

          {/* Data */}
          <div>
            <p className="text-label-sm text-text-secondary mb-3 px-1">
              {strings.settings.data}
            </p>
            <div className={sectionClass}>
              <div className="px-5 py-4 border-b border-border-default">
                <p className="text-meta text-text-secondary">
                  {strings.settings.dataInfo}
                </p>
                <p className="text-meta text-text-secondary mt-1">
                  Tutti i dati rimangono sul dispositivo.
                </p>
              </div>

              {/* Restore Default Workout Routine */}
              <div className="px-5 py-3 border-b border-border-default flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">
                    Ripristina scheda predefinita
                  </p>
                  <p className="text-meta text-text-secondary">
                    Aggiorna le 4 sedute all'ultima versione senza toccare lo storico
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRestoreProgramConfirm(true)}
                  className="min-h-[44px] px-3 text-meta text-accent-primary font-semibold flex items-center gap-1.5 hover:underline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Ripristina
                </button>
              </div>

              {/* Reset all data */}
              <div className="px-5 py-3">
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="text-danger text-meta font-semibold min-h-[44px] py-2 flex items-center rounded-btn hover:underline transition-colors"
                >
                  {strings.settings.resetData}
                </button>
              </div>
            </div>
          </div>

          {/* Version */}
          <div className="text-center pb-4">
            <p className="text-label-sm text-text-secondary">
              {strings.settings.version} 1.0.0 (Scheda V2)
            </p>
          </div>

          {/* Toasts */}
          <AnimatePresence>
            {resetDone && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-bg-elevated border border-border-default rounded-pill px-5 py-3 text-meta text-text-primary shadow-lg z-50"
              >
                <span className="text-icon-accent" aria-hidden>
                  ✓
                </span>{' '}
                Dati resettati
              </motion.div>
            )}
            {restoreDone && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-bg-elevated border border-accent-primary/40 rounded-pill px-5 py-3 text-meta text-text-primary shadow-lg z-50"
              >
                <span className="text-icon-accent" aria-hidden>
                  ✓
                </span>{' '}
                Scheda predefinita ripristinata con successo
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <AnimatePresence>
        {showRestoreProgramConfirm && (
          <ConfirmDialog
            isOpen={showRestoreProgramConfirm}
            title="Ripristinare la scheda predefinita?"
            description="Le 4 sedute verranno reimpostate alla versione ufficiale (Scheda Allenamento 4 sedute). Lo storico dei workout già completati rimarrà intatto."
            confirmLabel="Ripristina Scheda"
            cancelLabel="Annulla"
            onConfirm={handleRestoreProgram}
            onCancel={() => setShowRestoreProgramConfirm(false)}
          />
        )}

        {showResetConfirm && (
          <ConfirmDialog
            isOpen={showResetConfirm}
            title={strings.settings.resetData}
            description={strings.settings.resetConfirm}
            confirmLabel={strings.settings.resetButton}
            cancelLabel={strings.settings.resetCancel}
            onConfirm={handleReset}
            onCancel={() => setShowResetConfirm(false)}
            isDanger
          />
        )}
      </AnimatePresence>
    </AppShell>
  );
};
