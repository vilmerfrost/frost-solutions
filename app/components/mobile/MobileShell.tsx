'use client';

import React from 'react';
import { MobileBottomTabBar } from './MobileBottomTabBar';

export interface MobileShellProps {
  children: React.ReactNode;
  showTabBar?: boolean;
  showFab?: boolean;
  fabIcon?: React.ReactNode;
  onFabClick?: () => void;
  fabLabel?: string;
}

/**
 * MobileShell - Field-First Design System
 * 
 * Wrapper component that applies field-first layout on mobile (< md breakpoint).
 * 
 * Features:
 * - Shows MobileBottomTabBar instead of hamburger menu
 * - Adds bottom padding for tab bar
 * - Optional Floating Action Button (FAB)
 * - Safe area support for iPhone notch
 */
export function MobileShell({
  children,
  showTabBar = true,
  showFab = false,
  fabIcon,
  onFabClick,
  fabLabel = 'Primär åtgärd',
}: MobileShellProps) {
  return (
    <div className="md:hidden min-h-screen flex flex-col">
      {/* Main content area with padding for tab bar */}
      <main className={`flex-1 ${showTabBar ? 'pb-20' : ''} safe-area-pb`}>
        {children}
      </main>

      {/* Floating Action Button */}
      {showFab && onFabClick && (
        <button
          onClick={onFabClick}
          className="fixed bottom-24 right-4 field-fab z-40"
          aria-label={fabLabel}
        >
          {fabIcon}
        </button>
      )}

      {/* Bottom Tab Bar */}
      {showTabBar && <MobileBottomTabBar />}
    </div>
  );
}

/**
 * MobileOnlyWrapper - Only renders children on mobile (< md breakpoint)
 */
export function MobileOnlyWrapper({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden">{children}</div>;
}

/**
 * DesktopOnlyWrapper - Only renders children on desktop (>= md breakpoint)
 */
export function DesktopOnlyWrapper({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:block">{children}</div>;
}

export default MobileShell;
