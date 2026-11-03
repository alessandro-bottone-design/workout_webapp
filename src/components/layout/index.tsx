/* ============================================
   SCREEN HEADER & BOTTOM NAVIGATION
   Apple visionOS Glassmorphism · 8px Grid
   ============================================ */

import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home, ClipboardList, BarChart2, CalendarDays } from 'lucide-react';
import { IconButton, ScreenTitle } from '@/components/ui';
import { RestTimerLayer } from '@/features/timer/TimerComponents';

interface ScreenHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  variant?: 'centered' | 'display';
  titleSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
  variant = 'centered',
  titleSize = 'lg',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  if (variant === 'display') {
    return (
      <header
        className={`sticky top-0 z-30 pt-[env(safe-area-inset-top)] ${
          transparent ? 'bg-transparent' : 'bg-bg-app/80 backdrop-blur-xl border-b border-border-glass'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-4">
          <div className="min-w-0 flex-1">
            <ScreenTitle size={titleSize} className="break-words font-semibold text-text-primary">
              {title}
            </ScreenTitle>
            {subtitle && (
              <p className="text-body text-text-secondary mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex-shrink-0 pt-0.5">{rightAction}</div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`sticky top-0 z-30 pt-[env(safe-area-inset-top)] ${
        transparent ? 'bg-transparent' : 'bg-bg-app/80 backdrop-blur-xl border-b border-border-glass'
      }`}
    >
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left: Back button */}
        <div className="w-12 flex items-center">
          {showBack && (
            <IconButton label="Indietro" onClick={handleBack} className="-ml-1">
              <ChevronLeft className="w-6 h-6 text-text-primary" strokeWidth={1.75} />
            </IconButton>
          )}
        </div>

        {/* Center: Title — No uppercase, SF Pro typography */}
        <div className="flex-1 text-center min-w-0 px-2">
          <h1 className="text-heading font-semibold text-text-primary truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-meta text-text-secondary truncate">{subtitle}</p>
          )}
        </div>

        {/* Right: Action */}
        <div className="w-12 flex justify-end items-center">{rightAction}</div>
      </div>
    </header>
  );
};

/* ============================================
   BOTTOM NAVIGATION — visionOS Floating Dock
   ============================================ */

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/program', label: 'Scheda', icon: ClipboardList },
  { to: '/progress', label: 'Progressi', icon: BarChart2 },
  { to: '/calendar', label: 'Calendario', icon: CalendarDays },
] as const;

export const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-32px)] max-w-[400px]"
      aria-label="Navigazione principale"
    >
      <div
        className="glass-dock rounded-full h-16 px-4 flex items-center justify-around shadow-2xl"
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className="flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 transition-transform active:scale-95"
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-icon-secondary'
                }`}
                strokeWidth={isActive ? 2 : 1.75}
              />
              <span
                className={`text-[12px] leading-none transition-colors duration-200 ${
                  isActive ? 'text-white font-semibold' : 'text-text-secondary font-normal'
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/* ============================================
   APP SHELL — Full screen wrapper
   ============================================ */

interface AppShellProps {
  children: React.ReactNode;
  showNav?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  showNav = true,
}) => (
  <div className="min-h-[100dvh] bg-bg-app flex flex-col max-w-[480px] mx-auto relative">
    <main className="flex-1 flex flex-col">{children}</main>
    {showNav && <BottomNavigation />}
    <RestTimerLayer hasNav={showNav} />
  </div>
);
