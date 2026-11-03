/* ============================================
   SETTINGS SCREEN
   Timer defaults, sound, vibration, gym hours, data reset
   Apple visionOS Glass Design System (No AI slop)
   ============================================ */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, RefreshCw, Download, Upload, Check, AlertCircle, User, LogOut, Cloud, Sparkles } from 'lucide-react';
import { AppShell, ScreenHeader } from '@/components/layout';
import { Button, Toggle, ConfirmDialog, GlassCard } from '@/components/ui';
import { settingsRepo, resetAllData } from '@/db/repositories';
import { seedDatabase, restoreDefaultProgram } from '@/db/seed';
import { seedProgressData } from '@/db/progressData';
import { downloadBackupFile, importBackupData } from '@/lib/backup';
import { useTimerStore } from '@/features/timer/timerStore';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import { AuthModal } from '@/features/auth/AuthModal';
import { syncAll, subscribeSyncStatus, type SyncStatus } from '@/lib/sync';
import { GYM_SCHEDULE, getGymStatus } from '@/lib/gymSchedule';
import { strings } from '@/lib/strings';
import type { AppSettings } from '@/types';

const REST_OPTIONS = [
  { label: '1:00', value: 60 },
  { label: '1:30', value: 90 },
  { label: '2:00', value: 120 },
  { label: '2:30', value: 150 },
];

const rowClass = 'flex items-center justify-between px-4 py-4 border-b border-white/10 last:border-b-0';

export const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultRestSeconds: 120,
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showRestoreProgramConfirm, setShowRestoreProgramConfirm] = useState(false);
  const [showLoadScreenshotConfirm, setShowLoadScreenshotConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImportJson, setPendingImportJson] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [importSummary, setImportSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);
  const [restoreDone, setRestoreDone] = useState(false);
  const [screenshotDataLoaded, setScreenshotDataLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase Auth & Sync State
  const { user, signOut } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncedAt: null,
    error: null,
  });

  const gymStatus = getGymStatus();
  const todayDayOfWeek = new Date().getDay();

  useEffect(() => {
    void settingsRepo.get().then(setSettings);
  }, []);

  useEffect(() => {
    return subscribeSyncStatus(setSyncStatus);
  }, []);

  const handleManualSync = async () => {
    if (!user) return;
    await syncAll(user.id);
  };

  const updateSetting = async (patch: Partial<AppSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await settingsRepo.update(patch);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await downloadBackupFile();
    } catch {
      setErrorMessage('Errore durante l\'esportazione del backup.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setPendingImportJson(content);
        setShowImportConfirm(true);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Impossibile leggere il file selezionato.');
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!pendingImportJson) return;
    try {
      const result = await importBackupData(pendingImportJson);
      setShowImportConfirm(false);
      setPendingImportJson(null);
      setImportSummary(`Backup importato: ${result.workoutCount} workout, ${result.programCount} schede`);
      const fresh = await settingsRepo.get();
      setSettings(fresh);
    } catch (err) {
      setShowImportConfirm(false);
      setPendingImportJson(null);
      setErrorMessage(err instanceof Error ? err.message : 'Errore durante l\'importazione.');
    }
  };

  const handleReset = async () => {
    await resetAllData();
    useTimerStore.setState({ timer: null });
    useWorkoutStore.getState().clearActiveWorkout();
    await seedDatabase();
    setShowResetConfirm(false);
    setResetDone(true);
    const fresh = await settingsRepo.get();
    setSettings(fresh);
  };

  const handleRestoreProgram = async () => {
    await restoreDefaultProgram();
    setShowRestoreProgramConfirm(false);
    setRestoreDone(true);
  };

  const handleLoadScreenshotData = async () => {
    await seedProgressData(true);
    setShowLoadScreenshotConfirm(false);
    setScreenshotDataLoaded(true);
    if (user) {
      void syncAll(user.id);
    }
  };

  useEffect(() => {
    if (!screenshotDataLoaded) return;
    const id = setTimeout(() => setScreenshotDataLoaded(false), 3000);
    return () => clearTimeout(id);
  }, [screenshotDataLoaded]);

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

  useEffect(() => {
    if (!importSummary) return;
    const id = setTimeout(() => setImportSummary(null), 4000);
    return () => clearTimeout(id);
  }, [importSummary]);

  useEffect(() => {
    if (!errorMessage) return;
    const id = setTimeout(() => setErrorMessage(null), 4000);
    return () => clearTimeout(id);
  }, [errorMessage]);

  return (
    <AppShell>
      <ScreenHeader title={strings.settings.title} variant="display" titleSize="lg" />

      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-4 pt-4 space-y-4">
          {/* Account & Cloud Sync Section */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-label-sm text-text-secondary font-semibold">Account e cloud</p>
              {user && (
                <span className="text-label-sm font-semibold text-white/80 px-2 py-0.5 rounded-full bg-white/10 border border-white/15">
                  Connesso
                </span>
              )}
            </div>

            <GlassCard className="p-4 space-y-4">
              {user ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white flex-shrink-0">
                      <User className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-semibold text-text-primary truncate">
                        {user.user_metadata?.full_name || 'Atleta'}
                      </p>
                      <p className="text-meta text-text-secondary truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Sync status info */}
                  <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-meta text-text-secondary">
                      <Cloud className="w-4 h-4 text-text-primary" strokeWidth={1.75} />
                      <span>
                        {syncStatus.isSyncing
                          ? 'Sincronizzazione in corso…'
                          : syncStatus.lastSyncedAt
                          ? `Sincronizzato alle ${new Date(syncStatus.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : 'Pronto per la sincronizzazione'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleManualSync}
                      disabled={syncStatus.isSyncing}
                      className="h-8 px-4 rounded-lg bg-white/10 hover:bg-white/20 text-white text-meta font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                      Sincronizza
                    </button>
                  </div>

                  <div className="pt-1">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => void signOut()}
                      className="text-danger hover:text-danger"
                    >
                      <LogOut className="w-4 h-4 mr-2" strokeWidth={1.75} />
                      Disconnetti account
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-white flex-shrink-0">
                      <Cloud className="w-6 h-6" strokeWidth={1.75} />
                    </div>
                    <div>
                      <h3 className="text-heading font-semibold text-text-primary">
                        Salva i progressi nel cloud
                      </h3>
                      <p className="text-meta text-text-secondary mt-1">
                        Crea un account o accedi per sincronizzare schede, serie e massimali su tutti i tuoi dispositivi.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="secondary"
                      fullWidth
                      onClick={() => {
                        setAuthModalMode('signin');
                        setShowAuthModal(true);
                      }}
                    >
                      Accedi
                    </Button>
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={() => {
                        setAuthModalMode('signup');
                        setShowAuthModal(true);
                      }}
                    >
                      Crea account
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </div>

          {/* Gym Schedule */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <p className="text-label-sm text-text-secondary font-semibold">Orari palestra</p>
              <span className="text-meta text-white/80 font-semibold flex items-center gap-2">
                <span
                  className={`inline-block w-2 h-2 rounded-full ${
                    gymStatus.isOpen ? 'bg-white' : 'bg-white/30'
                  }`}
                />
                {gymStatus.statusText}
              </span>
            </div>

            <GlassCard className="p-4 space-y-2">
              {GYM_SCHEDULE.map((item) => {
                const isToday = item.days.includes(todayDayOfWeek);
                return (
                  <div
                    key={item.dayLabel}
                    className={`flex items-center justify-between text-meta py-2 px-4 rounded-xl ${
                      isToday
                        ? 'bg-white/10 text-white font-semibold'
                        : 'text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${isToday ? 'text-white' : 'text-text-secondary'}`} strokeWidth={1.75} />
                      <span>{item.dayLabel}</span>
                      {isToday && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-white text-black font-semibold">
                          Oggi
                        </span>
                      )}
                    </div>
                    <span className={isToday ? 'text-white' : 'text-text-primary'}>
                      {item.hoursFormatted}
                    </span>
                  </div>
                );
              })}
            </GlassCard>
          </div>

          {/* Timer default */}
          <div>
            <p className="text-label-sm text-text-secondary mb-4 px-1 font-semibold">Timer</p>
            <GlassCard className="p-4">
              <p className="text-body text-text-primary mb-4">
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
                    whileTap={{ scale: 0.95 }}
                    onClick={() => void updateSetting({ defaultRestSeconds: opt.value })}
                    role="radio"
                    aria-checked={settings.defaultRestSeconds === opt.value}
                    className={`h-12 rounded-xl text-meta font-semibold border transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40 ${
                      settings.defaultRestSeconds === opt.value
                        ? 'bg-white text-black border-white'
                        : 'bg-white/[0.04] text-text-secondary border-white/10 hover:text-text-primary'
                    }`}
                  >
                    {opt.label}
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Weekly target */}
          <div>
            <p className="text-label-sm text-text-secondary mb-4 px-1 font-semibold">Obiettivo</p>
            <GlassCard className="overflow-hidden">
              <div className={rowClass}>
                <div className="pr-4">
                  <p className="text-body text-text-primary font-semibold">{strings.settings.weeklyTarget}</p>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Quanti allenamenti punti ogni settimana
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      void updateSetting({
                        weeklyTarget: Math.max(1, (settings.weeklyTarget ?? 4) - 1),
                      })
                    }
                    disabled={(settings.weeklyTarget ?? 4) <= 1}
                    aria-label={strings.settings.weeklyTargetDecrease}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-text-primary bg-white/[0.04] border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-[20px] font-semibold text-text-primary tabular-nums">
                    {settings.weeklyTarget ?? 4}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void updateSetting({
                        weeklyTarget: Math.min(14, (settings.weeklyTarget ?? 4) + 1),
                      })
                    }
                    disabled={(settings.weeklyTarget ?? 4) >= 14}
                    aria-label={strings.settings.weeklyTargetIncrease}
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-text-primary bg-white/[0.04] border border-white/10 hover:bg-white/10 disabled:opacity-30 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Feedback */}
          <div>
            <p className="text-label-sm text-text-secondary mb-4 px-1 font-semibold">Feedback</p>
            <GlassCard className="overflow-hidden">
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
            </GlassCard>
          </div>

          {/* Integrations */}
          <div>
            <p className="text-label-sm text-text-secondary mb-4 px-1 font-semibold">Integrazioni</p>
            <GlassCard className="overflow-hidden">
              <div className={rowClass}>
                <span className="text-body text-text-primary">
                  {strings.settings.appleHealth}
                </span>
                <span className="text-meta text-text-secondary">
                  {strings.settings.appleHealthNote}
                </span>
              </div>
            </GlassCard>
          </div>

          {/* Data */}
          <div>
            <p className="text-label-sm text-text-secondary mb-4 px-1 font-semibold">
              {strings.settings.data}
            </p>
            <GlassCard className="overflow-hidden">
              <div className="px-4 py-4 border-b border-white/10">
                <p className="text-meta text-text-secondary">
                  {strings.settings.dataInfo}
                </p>
                <p className="text-meta text-text-secondary mt-1">
                  Tutti i dati rimangono sul dispositivo.
                </p>
              </div>

              {/* Export Backup JSON */}
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">
                    Esporta backup (JSON)
                  </p>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Scarica una copia dei tuoi dati
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="min-h-[48px] px-4 text-meta text-white hover:text-white/80 font-semibold flex items-center gap-2 hover:underline disabled:opacity-50"
                >
                  <Download className="w-4 h-4" strokeWidth={1.75} />
                  {isExporting ? 'Esportazione…' : 'Esporta'}
                </button>
              </div>

              {/* Import Backup JSON */}
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">
                    Importa backup (JSON)
                  </p>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Ripristina schede e storico da un file JSON
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[48px] px-4 text-meta text-white hover:text-white/80 font-semibold flex items-center gap-2 hover:underline"
                >
                  <Upload className="w-4 h-4" strokeWidth={1.75} />
                  Importa
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelected}
                  className="hidden"
                />
              </div>

              {/* Load Screenshot Progress Data */}
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-body font-semibold text-text-primary">
                    Carica storico da screenshot
                  </p>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Importa i 9 workout, carichi e progressioni salvati
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLoadScreenshotConfirm(true)}
                  className="min-h-[48px] px-4 text-meta text-white hover:text-white/80 font-semibold flex items-center gap-2 hover:underline"
                >
                  <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                  Carica
                </button>
              </div>

              {/* Restore Default Workout Routine */}
              <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-semibold text-text-primary">
                    Ripristina scheda predefinita
                  </p>
                  <p className="text-meta text-text-secondary mt-0.5">
                    Aggiorna le sedute all'ultima versione
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRestoreProgramConfirm(true)}
                  className="min-h-[48px] px-4 text-meta text-white hover:text-white/80 font-semibold flex items-center gap-2 hover:underline"
                >
                  <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
                  Ripristina
                </button>
              </div>

              {/* Reset all data */}
              <div className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-danger text-meta font-semibold min-h-[48px] py-2 flex items-center hover:underline transition-colors"
                >
                  {strings.settings.resetData}
                </button>
              </div>
            </GlassCard>
          </div>

          {/* Version */}
          <div className="text-center pb-4">
            <p className="text-label-sm text-text-secondary">
              {strings.settings.version} 1.0.0 (Scheda V2)
            </p>
          </div>

          {/* Toasts — Floating visionOS glass pills */}
          <AnimatePresence>
            {resetDone && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-4 text-meta text-text-primary shadow-2xl flex items-center gap-2 z-50"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={1.75} />
                {strings.settings.resetDone}
              </motion.div>
            )}
            {restoreDone && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-4 text-meta text-text-primary shadow-2xl flex items-center gap-2 z-50"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={1.75} />
                {strings.settings.restoreDone}
              </motion.div>
            )}
            {screenshotDataLoaded && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-4 text-meta text-text-primary shadow-2xl flex items-center gap-2 z-50"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={1.75} />
                Storico e 9 workout caricati con successo
              </motion.div>
            )}
            {importSummary && (
              <motion.div
                role="status"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-6 py-4 text-meta text-text-primary shadow-2xl flex items-center gap-2 z-50"
              >
                <Check className="w-4 h-4 text-white" strokeWidth={1.75} />
                {importSummary}
              </motion.div>
            )}
            {errorMessage && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-red-950/80 backdrop-blur-2xl border border-red-500/40 rounded-full px-6 py-4 text-meta text-white shadow-2xl flex items-center gap-2 z-50"
              >
                <AlertCircle className="w-4 h-4 text-red-400" strokeWidth={1.75} />
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <AnimatePresence>
        {showImportConfirm && (
          <ConfirmDialog
            isOpen={showImportConfirm}
            title="Ripristinare il backup?"
            description="Questa operazione sostituirà i dati attuali con quelli contenuti nel file JSON selezionato."
            confirmLabel="Importa dati"
            cancelLabel="Annulla"
            onConfirm={handleConfirmImport}
            onCancel={() => {
              setShowImportConfirm(false);
              setPendingImportJson(null);
            }}
            isDanger
          />
        )}

        {showLoadScreenshotConfirm && (
          <ConfirmDialog
            isOpen={showLoadScreenshotConfirm}
            title="Caricare i dati dagli screenshot?"
            description="Verranno importati la scheda ufficiale e i 9 workout completati con tutti i carichi registrati (Chest Press 47.3kg, Leg Extension 63.6kg, Lat Machine 20.3kg, ecc.)."
            confirmLabel="Carica storico"
            cancelLabel="Annulla"
            onConfirm={handleLoadScreenshotData}
            onCancel={() => setShowLoadScreenshotConfirm(false)}
          />
        )}

        {showRestoreProgramConfirm && (
          <ConfirmDialog
            isOpen={showRestoreProgramConfirm}
            title={strings.settings.restoreTitle}
            description={strings.settings.restoreDetail}
            confirmLabel={strings.settings.restoreConfirm}
            cancelLabel={strings.settings.restoreCancel}
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

      {/* Auth Modal for Supabase account creation / login */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </AppShell>
  );
};
