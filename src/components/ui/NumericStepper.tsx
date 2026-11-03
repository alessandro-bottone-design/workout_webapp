/* ============================================
   NUMERIC STEPPER — visionOS Glass Controls
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

interface NumericStepperProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export const NumericStepper: React.FC<NumericStepperProps> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
}) => {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));

  const name = label ?? 'valore';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      e.preventDefault();
      inc();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      e.preventDefault();
      dec();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {label && (
        <p className="text-label-sm text-text-secondary font-semibold">{label}</p>
      )}
      <div className="flex items-center gap-6">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={dec}
          disabled={value <= min}
          aria-label={`Riduci ${name}`}
          className="w-14 h-14 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white flex items-center justify-center disabled:opacity-25 hover:bg-white/[0.14] active:bg-white/[0.20] transition-colors"
        >
          <Minus className="w-6 h-6" strokeWidth={1.75} />
        </motion.button>
        <span
          role="spinbutton"
          tabIndex={0}
          aria-label={name}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuetext={`${value}`}
          onKeyDown={handleKeyDown}
          className="text-numeric-lg font-semibold text-text-primary w-24 text-center tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-btn select-none"
        >
          {value}
        </span>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={inc}
          disabled={value >= max}
          aria-label={`Aumenta ${name}`}
          className="w-14 h-14 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.12] text-white flex items-center justify-center disabled:opacity-25 hover:bg-white/[0.14] active:bg-white/[0.20] transition-colors"
        >
          <Plus className="w-6 h-6" strokeWidth={1.75} />
        </motion.button>
      </div>
    </div>
  );
};
