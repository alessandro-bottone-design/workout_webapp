/* ============================================
   BADGE
   ============================================ */

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'danger' | 'warning';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default' }) => {
  const variants = {
    default: 'bg-bg-elevated text-text-secondary border border-border-default',
    accent: 'bg-accent-primary/10 text-accent-primary border-accent-primary/20',
    danger: 'bg-danger/10 text-danger border-danger/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-pill border text-label-sm ${variants[variant]}`}
    >
      {children}
    </span>
  );
};
