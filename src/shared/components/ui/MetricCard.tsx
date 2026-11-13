/* ============================================
   METRIC CARD — visionOS Glass Surface
   ============================================ */

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub }) => (
  <div className="glass-panel rounded-card p-4 flex flex-col justify-between">
    <p className="text-label-sm text-text-secondary mb-1">{label}</p>
    <p className="text-[28px] font-semibold text-text-primary leading-none tabular-nums">{value}</p>
    {sub && <p className="text-meta text-text-secondary mt-1">{sub}</p>}
  </div>
);
