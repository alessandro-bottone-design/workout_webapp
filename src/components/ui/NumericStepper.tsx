/* ============================================
   NUMERIC STEPPER
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';

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

  // Arrow keys adjust the value when the spinbutton itself has focus, so
  // keyboard/switch users don't have to tab through the −/+ buttons.
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
        <p className="text-label-sm text-text-secondary">{label}</p>
      )}
      <div className="flex items-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={dec}
          disabled={value <= min}
          aria-label={`Riduci ${name}`}
          className="w-14 h-14 rounded-full bg-bg-elevated border border-border-default text-text-primary text-2xl font-light flex items-center justify-center disabled:opacity-30 active:bg-white/10"
        >
          −
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
          className="text-[52px] font-bold text-text-primary w-20 text-center tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-btn"
        >
          {value}
        </span>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={inc}
          disabled={value >= max}
          aria-label={`Aumenta ${name}`}
          className="w-14 h-14 rounded-full bg-bg-elevated border border-border-default text-text-primary text-2xl font-light flex items-center justify-center disabled:opacity-30 active:bg-white/10"
        >
          +
        </motion.button>
      </div>
    </div>
  );
};
