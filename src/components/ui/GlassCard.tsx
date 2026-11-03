/* ============================================
   GLASS CARD — Apple visionOS Material
   ============================================ */

import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  elevated = false,
  className = '',
  ...props
}) => (
  <div
    className={`rounded-card p-4 transition-all ${
      elevated
        ? 'bg-white/[0.09] backdrop-blur-2xl border border-white/[0.14]'
        : 'bg-white/[0.05] backdrop-blur-xl border border-white/[0.08]'
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);
