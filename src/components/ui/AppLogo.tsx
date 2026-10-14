/* ============================================
   APP LOGO — Brand LogoDef (Figma 156×47)
   ============================================ */

import React from 'react';
import logoUrl from '@/assets/brand/workout-lab-logo.svg';

interface AppLogoProps {
  width?: number;
  className?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  width = 156,
  className = '',
}) => (
  <img
    src={logoUrl}
    alt="Workout Lab"
    width={width}
    height={Math.round(width * (46.886 / 156))}
    className={`block ${className}`}
    draggable={false}
  />
);
