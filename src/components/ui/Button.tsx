/* ============================================
   BUTTON COMPONENTS
   ============================================ */

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'default',
  isLoading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-200 select-none active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary disabled:opacity-40 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-accent-primary text-bg-app hover:brightness-110',
    secondary:
      'bg-bg-elevated text-text-primary border border-border-default hover:bg-white/5',
    danger:
      'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
    ghost:
      'text-text-secondary hover:text-text-primary hover:bg-white/5',
  };

  const sizes = {
    default: 'h-[56px] px-6 text-[15px] tracking-wide',
    sm: 'h-[44px] px-4 text-[14px]',
    lg: 'h-[64px] px-8 text-[16px]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || isLoading}
      onClick={props.onClick}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      type={props.type ?? 'button'}
      aria-label={props['aria-label']}
      aria-pressed={props['aria-pressed']}
      id={props.id}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
      ) : null}
      {children}
    </motion.button>
  );
};
