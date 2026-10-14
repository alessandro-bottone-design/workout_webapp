/* ============================================
   METRIC CARD
   ============================================ */

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, sub }) => (
  <div className="bg-bg-surface rounded-card border border-border-default p-5">
    <p className="text-label-sm text-text-secondary mb-1">{label}</p>
    <p className="text-[28px] font-bold text-text-primary leading-none">{value}</p>
    {sub && <p className="text-meta text-text-secondary mt-1">{sub}</p>}
  </div>
);
