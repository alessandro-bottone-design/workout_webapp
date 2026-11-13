/* ============================================
   SCREEN TITLE — Syne ExtraBold display title
   ============================================ */

import React from 'react';

type ScreenTitleSize = 'sm' | 'md' | 'lg' | 'xl';

interface ScreenTitleProps {
  children: React.ReactNode;
  size?: ScreenTitleSize;
  className?: string;
  as?: 'h1' | 'h2';
}

const titleSizes: Record<ScreenTitleSize, string> = {
  sm: 'text-[24px]',
  md: 'text-[26px]',
  lg: 'text-[28px]',
  xl: 'text-[30px]',
};

export const ScreenTitle: React.FC<ScreenTitleProps> = ({
  children,
  size = 'lg',
  className = '',
  as: Tag = 'h1',
}) => (
  <Tag className={`screen-title ${titleSizes[size]} ${className}`}>
    {children}
  </Tag>
);
