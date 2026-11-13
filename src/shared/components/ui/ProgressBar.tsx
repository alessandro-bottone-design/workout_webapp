/* ============================================
   PROGRESS BAR — Apple visionOS Style
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0–1
  className?: string;
  accentColor?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  className = '',
  accentColor = true,
}) => {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`h-1 bg-white/[0.08] rounded-full overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className={`h-full rounded-full ${accentColor ? 'bg-white' : 'bg-text-secondary'}`}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
};
