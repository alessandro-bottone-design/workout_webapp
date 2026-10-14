/* ============================================
   WEIGHT EDITOR SHEET
   Bottom sheet with numeric keypad
   ============================================ */

import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { Button } from '@/components/ui';
import { useDialogA11y } from '@/lib/useDialogA11y';
import { parseWeight, formatWeightValue } from '@/lib/formatters';
import { strings } from '@/lib/strings';

interface WeightEditorSheetProps {
  currentWeight: number;
  lastWeight?: number;
  exerciseName: string;
  setNumber: number;
  onSave: (weight: number) => void;
  onCancel: () => void;
}

const KEYPAD = [
  ['7', '8', '9'],
  ['4', '5', '6'],
  ['1', '2', '3'],
  [',', '0', '⌫'],
] as const;

export const WeightEditorSheet: React.FC<WeightEditorSheetProps> = ({
  currentWeight,
  lastWeight,
  exerciseName,
  setNumber,
  onSave,
  onCancel,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  // Sheet is only rendered when open, so treat it as always-modal here.
  useDialogA11y(true, onCancel, sheetRef);

  const [input, setInput] = useState(
    currentWeight > 0 ? formatWeightValue(currentWeight) : ''
  );

  const handleKey = useCallback((key: string) => {
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    // Prevent multiple decimals
    if ((key === '.' || key === ',') && (input.includes('.') || input.includes(','))) return;
    // Max length
    if (input.length >= 6) return;
    // Prevent leading zeros
    if (input === '0' && key !== '.' && key !== ',') {
      setInput(key);
      return;
    }
    setInput((prev) => prev + key);
  }, [input]);

  const parsedWeight = parseWeight(input);
  // Require at least one digit — prevents saving "" or "." as 0
  const isValid = /\d/.test(input) && !Number.isNaN(parseFloat(input.replace(',', '.')));

  const handleSave = () => {
    if (!isValid) return;
    onSave(parsedWeight);
  };

  // Quick +Δ for progressive overload: snaps the running value to the new
  // total so the user does not retype the whole weight.
  const handleDelta = useCallback((delta: number) => {
    setInput((prev) => {
      const base = parseWeight(prev);
      const next = Math.max(0, Math.round((base + delta) * 100) / 100);
      return formatWeightValue(next);
    });
  }, []);

  // Italian display: decimal comma (domain value stays numeric)
  const displayValue = input.replace('.', ',');

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Sheet */}
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weight-editor-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-bg-elevated rounded-t-modal border-t border-border-default focus:outline-none"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-default" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-border-default">
          <p id="weight-editor-title" className="screen-title text-[26px] tracking-[-0.42px] uppercase">
            {exerciseName}
          </p>
          <p className="text-meta text-text-secondary mt-0.5">
            Modifica peso · Serie {setNumber}
          </p>
        </div>

        {/* Weight Display */}
        <div className="px-5 py-6 text-center">
          <div className="flex items-baseline justify-center gap-2 min-h-[72px]">
            <span className="text-[64px] font-bold text-text-primary tabular-nums leading-none">
              {displayValue || '0'}
            </span>
            <span className="text-[24px] text-text-secondary font-normal">kg</span>
          </div>
          {lastWeight !== undefined && (
            <p className="text-meta text-text-secondary mt-2">
              Ultima volta: {formatWeightValue(lastWeight)} kg
            </p>
          )}
        </div>

        {/* Quick Δ for progressive overload */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2.5, 5].map((delta) => (
              <motion.button
                key={delta}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDelta(delta)}
                aria-label={`Aumenta di ${formatWeightValue(delta)} kg`}
                className="h-[44px] rounded-btn flex items-center justify-center text-[15px] font-semibold bg-bg-surface border border-border-default text-text-primary hover:bg-white/5 active:bg-white/10 transition-colors"
              >
                +{formatWeightValue(delta)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="px-5 pb-4">
          <div className="grid grid-cols-3 gap-2">
            {KEYPAD.flat().map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleKey(key)}
                aria-label={key === '⌫' ? 'Cancella' : key}
                className={`h-[56px] rounded-btn flex items-center justify-center text-xl font-semibold transition-colors ${
                  key === '⌫'
                    ? 'bg-danger/10 text-danger hover:bg-danger/20'
                    : 'bg-bg-surface border border-border-default text-text-primary hover:bg-white/5 active:bg-white/10'
                }`}
              >
                {key === '⌫' ? <Delete className="w-5 h-5" /> : key}
              </motion.button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="px-5 pb-4 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {strings.actions.cancel}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!isValid}
            onClick={handleSave}
          >
            SALVA {isValid ? formatWeightValue(parsedWeight).replace('.', ',') + ' KG' : ''}
          </Button>
        </div>
      </motion.div>
    </>
  );
};
