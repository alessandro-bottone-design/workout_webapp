/* ============================================
   ICON BUTTON — 44×44 hit target, 24px icon
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
    default: 'text-icon-secondary hover:text-icon-primary active:text-icon-primary',
    accent: 'text-icon-accent hover:brightness-110',
    danger: 'text-danger hover:opacity-80',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`w-11 h-11 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary rounded-full ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
