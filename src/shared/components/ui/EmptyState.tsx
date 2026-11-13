/* ============================================
   EMPTY STATE
   ============================================ */

import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    {icon && (
      <div className="w-16 h-16 rounded-full bg-bg-elevated flex items-center justify-center mb-4 text-text-secondary">
        {icon}
      </div>
    )}
    <p className="text-heading text-text-primary mb-2">{title}</p>
    {description && (
      <p className="text-body text-text-secondary max-w-[280px]">{description}</p>
    )}
    {action && <div className="mt-6">{action}</div>}
  </div>
);
