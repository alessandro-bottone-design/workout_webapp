/* ============================================
   WEIGHT EDITOR SHEET — visionOS Numeric Sheet
   Monochrome Glass · 8px Grid · No Slop
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
  useDialogA11y(true, onCancel, sheetRef);

  const [input, setInput] = useState(
    currentWeight > 0 ? formatWeightValue(currentWeight) : ''
  );

  const handleKey = useCallback((key: string) => {
    if (key === '⌫') {
      setInput((prev) => prev.slice(0, -1));
      return;
    }
    if ((key === '.' || key === ',') && (input.includes('.') || input.includes(','))) return;
    if (input.length >= 6) return;
    if (input === '0' && key !== '.' && key !== ',') {
      setInput(key);
      return;
    }
    setInput((prev) => prev + key);
  }, [input]);

  const parsedWeight = parseWeight(input);
  const isValid = /\d/.test(input) && !Number.isNaN(parseFloat(input.replace(',', '.')));

  const handleSave = () => {
    if (!isValid) return;
    onSave(parsedWeight);
  };

  const handleDelta = useCallback((delta: number) => {
    setInput((prev) => {
      const base = parseWeight(prev);
      const next = Math.max(0, Math.round((base + delta) * 100) / 100);
      return formatWeightValue(next);
    });
  }, []);

  const displayValue = input.replace('.', ',');

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-2xl"
        onClick={onCancel}
      />

      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="weight-editor-title"
        tabIndex={-1}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 max-w-[480px] mx-auto bg-[#161618]/95 backdrop-blur-3xl rounded-t-modal border-t border-white/[0.12] p-6 pb-[calc(32px+env(safe-area-inset-bottom))] focus:outline-none shadow-2xl"
      >
        {/* Grab Handle */}
        <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-6" />

        {/* Header */}
        <div className="pb-4 border-b border-white/[0.08]">
          <p id="weight-editor-title" className="text-title font-semibold text-text-primary">
            {exerciseName}
          </p>
          <p className="text-meta text-text-secondary mt-1 font-normal">
            Modifica peso · Serie {setNumber}
          </p>
        </div>

        {/* Weight Display */}
        <div className="py-6 text-center">
          <div className="flex items-baseline justify-center gap-2 min-h-[64px]">
            <span className="text-[64px] font-semibold text-text-primary tabular-nums leading-none">
              {displayValue || '0'}
            </span>
            <span className="text-title text-text-secondary font-normal">kg</span>
          </div>
          {lastWeight !== undefined && (
            <p className="text-meta text-text-secondary mt-2 font-normal">
              Ultima volta: {formatWeightValue(lastWeight)} kg
            </p>
          )}
        </div>

        {/* Quick Delta Buttons */}
        <div className="pb-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2.5, 5].map((delta) => (
              <motion.button
                key={delta}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleDelta(delta)}
                aria-label={`Aumenta di ${formatWeightValue(delta)} kg`}
                className="h-12 rounded-btn flex items-center justify-center text-[15px] font-semibold bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white hover:bg-white/[0.14] active:bg-white/[0.20] transition-colors"
              >
                +{formatWeightValue(delta)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Numeric Keypad */}
        <div className="pb-4">
          <div className="grid grid-cols-3 gap-2">
            {KEYPAD.flat().map((key) => (
              <motion.button
                key={key}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleKey(key)}
                aria-label={key === '⌫' ? 'Cancella' : key}
                className={`h-12 rounded-btn flex items-center justify-center text-xl font-semibold transition-colors ${
                  key === '⌫'
                    ? 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white hover:bg-white/[0.12] active:bg-white/[0.18]'
                }`}
              >
                {key === '⌫' ? <Delete className="w-5 h-5" strokeWidth={1.75} /> : key}
              </motion.button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {strings.actions.cancel}
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={!isValid}
            onClick={handleSave}
          >
            {isValid ? `Salva ${formatWeightValue(parsedWeight).replace('.', ',')} kg` : 'Salva'}
          </Button>
        </div>
      </motion.div>
    </>
  );
};
