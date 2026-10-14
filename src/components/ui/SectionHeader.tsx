/* ============================================
   SECTION HEADER
   ============================================ */

import React from 'react';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="text-label-sm text-text-secondary">{title}</h2>
    {action}
  </div>
);
