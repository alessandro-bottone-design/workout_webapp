/* ============================================
   ICON BUTTON — 48×48 hit target, Apple visionOS Glass
   ============================================ */

import React from 'react';

interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: React.ReactNode;
  tone?: 'default' | 'accent' | 'danger';
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  children,
  tone = 'default',
  className = '',
  ...props
}) => {
  const tones = {
    default: 'text-icon-secondary hover:text-icon-primary hover:bg-white/[0.06] active:bg-white/[0.10]',
    accent: 'text-white hover:bg-white/[0.10] active:bg-white/[0.16]',
    danger: 'text-danger hover:bg-danger/10 active:bg-danger/20',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`w-12 h-12 shrink-0 flex items-center justify-center transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-2xl active:scale-95 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
