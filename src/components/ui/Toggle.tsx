/* ============================================
   TOGGLE SWITCH
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled,
}) => {
  // Associate the visible text with the switch so clicking the label
  // toggles it and screen readers announce the name via <label>.
  const toggleId = React.useId();

  return (
    <div className="flex items-center justify-between gap-4">
      {label && (
        <label
          htmlFor={toggleId}
          className="text-body text-text-primary cursor-pointer select-none"
        >
          {label}
        </label>
      )}
      <motion.button
        id={toggleId}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-7 rounded-pill transition-colors duration-200 flex items-center px-0.5 after:absolute after:-inset-y-2 after:-inset-x-1 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary ${
          checked ? 'bg-accent-primary' : 'bg-bg-elevated border border-border-default'
        } disabled:opacity-40`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`w-6 h-6 rounded-full shadow-sm ${
            checked ? 'bg-bg-app' : 'bg-text-secondary'
          }`}
        />
      </motion.button>
    </div>
  );
};
