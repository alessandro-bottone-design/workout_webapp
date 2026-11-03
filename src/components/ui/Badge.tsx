/* ============================================
   BADGE — visionOS Style
   ============================================ */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'danger' | 'warning';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variants = {
    default: 'bg-white/[0.06] text-text-secondary border border-white/[0.08]',
    accent: 'bg-white/[0.12] text-white border border-white/[0.18]',
    danger: 'bg-danger/15 text-danger border border-danger/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[12px] font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
