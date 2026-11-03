/* ============================================
   BUTTON COMPONENTS — Apple visionOS Style
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
    'inline-flex items-center justify-center font-semibold rounded-btn transition-all duration-200 select-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 disabled:pointer-events-none';

  const variants = {
    primary:
      'bg-white text-black hover:bg-white/90 shadow-sm',
    secondary:
      'bg-white/[0.08] backdrop-blur-xl text-white border border-white/[0.12] hover:bg-white/[0.14]',
    danger:
      'bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25',
    ghost:
      'text-text-secondary hover:text-white hover:bg-white/[0.06]',
  };

  const sizes = {
    default: 'h-12 px-6 text-[15px]',
    sm: 'h-10 px-4 text-[14px]',
    lg: 'h-16 px-8 text-[16px]',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
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
