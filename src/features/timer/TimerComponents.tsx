/* ============================================
   REST TIMER — Apple visionOS Design System
   Monochrome Glass · 8px Grid · No Slop
   ============================================ */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Timer, Check } from 'lucide-react';
import { useTimerStore, playTimerBeep, vibrateTimerComplete } from './timerStore';
import { settingsRepo } from '@/db/repositories';
import { useDialogA11y } from '@/lib/useDialogA11y';
import { formatTimerSeconds } from '@/lib/formatters';
import { strings } from '@/lib/strings';

/* ============================================
   useRemainingSeconds — shared ticker
   ============================================ */

function useRemainingSeconds(onExpired?: () => void): number {
  const timer = useTimerStore((s) => s.timer);
  const [remaining, setRemaining] = useState(0);
  const hasTriggeredRef = useRef(false);
  const onExpiredRef = useRef(onExpired);
  onExpiredRef.current = onExpired;

  useEffect(() => {
    if (!timer || timer.status !== 'running') {
      setRemaining(0);
      return;
    }

    hasTriggeredRef.current = false;

    const update = () => {
      const secs = (timer.endAt - Date.now()) / 1000;
      if (secs <= 0) {
        setRemaining(0);
        if (!hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onExpiredRef.current?.();
        }
      } else {
        setRemaining(secs);
      }
    };

    update();
    const id = setInterval(update, 250);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) return 0;
  if (timer.status === 'completed') return 0;
  return remaining;
}

/* ============================================
   TIMER COMPLETION FEEDBACK
   ============================================ */

let lastFeedbackAt = 0;

async function fireCompletionFeedback(): Promise<void> {
  const { markCompleted, timer } = useTimerStore.getState();
  const now = Date.now();
  const alreadyCompleted = timer?.status === 'completed';
  await markCompleted();
  if (alreadyCompleted || now - lastFeedbackAt < 2000) return;
  lastFeedbackAt = now;
  try {
    const s = await settingsRepo.get();
    await playTimerBeep(s.soundEnabled);
    vibrateTimerComplete(s.vibrationEnabled);
  } catch {
    // Visual feedback already applied
  }
}

/* ============================================
   REST TIMER LAYER — floating pill
   ============================================ */

interface RestTimerLayerProps {
  hasNav: boolean;
}

export const RestTimerLayer: React.FC<RestTimerLayerProps> = ({ hasNav }) => {
  const timer = useTimerStore((s) => s.timer);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCompletedPill, setShowCompletedPill] = useState(false);
  const sheetOpenRef = useRef(false);
  sheetOpenRef.current = sheetOpen;

  const handleExpired = useCallback(() => {
    void fireCompletionFeedback();
  }, []);

  const remaining = useRemainingSeconds(handleExpired);

  useEffect(() => {
    if (timer?.status !== 'completed') {
      setShowCompletedPill(false);
      return;
    }
    setShowCompletedPill(true);
    const t = setTimeout(() => {
      setShowCompletedPill(false);
      if (!sheetOpenRef.current) {
        void useTimerStore.getState().stopTimer();
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [timer?.status]);

  if (!timer || timer.status === 'idle') return null;

  const isCompletedStatus = timer.status === 'completed';
  const pillCompleted = isCompletedStatus;
  const pillVisible =
    timer.status === 'running' ||
    (isCompletedStatus && (showCompletedPill || sheetOpen));

  const bottomOffset = hasNav
    ? 'calc(88px + env(safe-area-inset-bottom))'
    : 'calc(24px + env(safe-area-inset-bottom))';

  const handleCloseSheet = () => {
    setSheetOpen(false);
    if (useTimerStore.getState().timer?.status === 'completed') {
      void useTimerStore.getState().stopTimer();
    }
  };

  return (
    <>
      {pillVisible && (
        <div
          className="fixed left-0 right-0 z-30 flex justify-center pointer-events-none px-4"
          style={{ bottom: bottomOffset }}
        >
          <AnimatePresence>
            <motion.button
              key={pillCompleted ? 'done' : 'running'}
              initial={{ y: 40, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.9 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={() => setSheetOpen(true)}
              className={`pointer-events-auto flex items-center gap-2 px-4 h-12 rounded-full border shadow-2xl transition-transform active:scale-95 ${
                pillCompleted
                  ? 'bg-white text-black border-white'
                  : 'glass-dock text-text-primary border-white/[0.14]'
              }`}
              aria-label={
                pillCompleted
                  ? `${strings.timer.restDone}. Apri timer`
                  : `${strings.timer.rest}: ${formatTimerSeconds(remaining)}. Apri timer`
              }
            >
              {!pillCompleted ? (
                <>
                  <Timer className="w-4 h-4 text-white" strokeWidth={1.75} aria-hidden />
                  <span className="text-meta font-normal text-text-secondary">
                    {strings.timer.rest}
                  </span>
                  <span className="text-meta font-semibold text-white tabular-nums">
                    {formatTimerSeconds(remaining)}
                  </span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-black stroke-[2.5]" aria-hidden />
                  <span className="text-meta font-semibold text-black">
                    {strings.timer.restDone}
                  </span>
                </>
              )}
            </motion.button>
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {sheetOpen && (
          <RestTimerSheet remaining={remaining} onClose={handleCloseSheet} />
        )}
      </AnimatePresence>
    </>
  );
};

/* ============================================
   REST TIMER SHEET — visionOS Focused Sheet
   ============================================ */

interface RestTimerSheetProps {
  remaining: number;
  onClose: () => void;
}

const PRESETS = [60, 90, 120, 150] as const;

const RestTimerSheet: React.FC<RestTimerSheetProps> = ({ remaining, onClose }) => {
  const { timer, stopTimer, startTimer, extendTimer } = useTimerStore();
  const sheetRef = useRef<HTMLDivElement>(null);
  useDialogA11y(true, onClose, sheetRef);

  const isCompleted = timer?.status === 'completed';

  if (!timer) return null;

  const duration = timer.durationSeconds || 1;
  const progress = isCompleted ? 1 : Math.max(0, Math.min(1, remaining / duration));

  const handleStop = async () => {
    await stopTimer();
    onClose();
  };

  const handlePreset = async (seconds: number) => {
    await startTimer(seconds, timer.exerciseId, timer.workoutId);
  };

  const handleExtend = async (seconds: number) => {
    await extendTimer(seconds);
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
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        role="dialog"
        aria-modal="true"
        aria-label={strings.timer.rest}
        tabIndex={-1}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-[#161618]/95 backdrop-blur-3xl rounded-t-modal border-t border-white/[0.12] focus:outline-none shadow-2xl p-6 pb-[calc(32px+env(safe-area-inset-bottom))]"
      >
        {/* Grab Handle */}
        <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-6" />

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-white" strokeWidth={1.75} aria-hidden />
            <p className="text-heading font-semibold text-text-primary">
              {isCompleted ? strings.timer.restDone : strings.timer.rest}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={strings.timer.dismiss}
            className="w-12 h-12 -mr-2 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-full hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.75} />
          </button>
        </div>

        {/* Big Time Display */}
        <div className="py-6 text-center">
          <motion.p
            key={isCompleted ? 'done' : 'time'}
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-numeric-lg font-semibold tabular-nums leading-none ${
              isCompleted ? 'text-white' : 'text-text-primary'
            }`}
            aria-live="polite"
          >
            {isCompleted ? '0:00' : formatTimerSeconds(remaining)}
          </motion.p>

          {/* Minimalist Progress Bar */}
          <div className="mt-6 h-1 bg-white/[0.08] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-white"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.25, ease: 'linear' }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-2">
          {isCompleted ? (
            <button
              onClick={onClose}
              className="w-full h-12 rounded-btn bg-white text-black text-[15px] font-semibold active:scale-[0.98] transition-transform"
            >
              {strings.timer.dismiss}
            </button>
          ) : (
            <>
              {/* Adjust Row */}
              <div className="flex gap-2">
                <button
                  onClick={() => void handleExtend(30)}
                  className="flex-1 h-12 rounded-btn bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white text-[15px] font-semibold active:scale-[0.98] hover:bg-white/[0.12] transition-colors"
                  aria-label={strings.timer.add30}
                >
                  +0:30
                </button>
                <button
                  onClick={() => void handleExtend(60)}
                  className="flex-1 h-12 rounded-btn bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white text-[15px] font-semibold active:scale-[0.98] hover:bg-white/[0.12] transition-colors"
                  aria-label={strings.timer.add60}
                >
                  +1:00
                </button>
                <button
                  onClick={() => void handleStop()}
                  className="flex-1 h-12 rounded-btn bg-danger/15 border border-danger/30 text-danger text-[15px] font-semibold active:scale-[0.98] hover:bg-danger/25 transition-colors"
                >
                  {strings.timer.stop}
                </button>
              </div>

              {/* Preset Restart Row */}
              <div>
                <p className="text-label-sm text-text-secondary font-semibold mb-2">
                  {strings.timer.presets}
                </p>
                <div className="flex gap-2">
                  {PRESETS.map((s) => {
                    const isActive = s === timer.durationSeconds;
                    return (
                      <button
                        key={s}
                        onClick={() => void handlePreset(s)}
                        aria-pressed={isActive}
                        className={`flex-1 h-12 rounded-btn text-[14px] font-semibold border transition-all ${
                          isActive
                            ? 'bg-white text-black border-white shadow-sm'
                            : 'bg-white/[0.06] text-text-secondary border-white/[0.08] hover:bg-white/[0.10]'
                        }`}
                      >
                        {formatTimerSeconds(s)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
};

/* ============================================
   REST PRESET BUTTONS (inline on Exercise Focus)
   ============================================ */

interface RestPresetsProps {
  preferredSeconds?: number;
  onSelect: (seconds: number) => void;
  activeSeconds?: number;
}

export const RestPresets: React.FC<RestPresetsProps> = ({
  preferredSeconds,
  onSelect,
  activeSeconds,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const idx = PRESETS.findIndex((s) => s === activeSeconds);
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    const next = PRESETS[(idx + dir + PRESETS.length) % PRESETS.length];
    if (next !== undefined) onSelect(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label={strings.workout.restPresets}
      onKeyDown={handleKeyDown}
      className="flex gap-2 flex-wrap"
    >
      {PRESETS.map((s) => {
        const isPreferred = s === preferredSeconds;
        const isActive = s === activeSeconds;
        return (
          <motion.button
            key={s}
            whileTap={{ scale: 0.94 }}
            onClick={() => onSelect(s)}
            role="radio"
            aria-checked={isActive}
            tabIndex={isActive || (!activeSeconds && isPreferred) ? 0 : -1}
            className={`flex-1 min-w-[64px] h-12 rounded-btn text-[14px] font-semibold border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
              isActive
                ? 'bg-white text-black border-white shadow-sm'
                : isPreferred
                ? 'bg-white/[0.12] text-white border-white/[0.20]'
                : 'bg-white/[0.05] text-text-secondary border-white/[0.08] hover:bg-white/[0.09]'
            }`}
          >
            {formatTimerSeconds(s)}
          </motion.button>
        );
      })}
    </div>
  );
};
