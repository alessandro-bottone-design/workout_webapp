/* ============================================
   DIVIDER
   ============================================ */

import React from 'react';

export const Divider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`h-px bg-border-default ${className}`} />
);
