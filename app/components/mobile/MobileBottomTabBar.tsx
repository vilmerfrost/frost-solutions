'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, MapPin, Users, LucideIcon } from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const tabs: Tab[] = [
  { id: 'tasks', label: 'Uppgifter', icon: ClipboardList, href: '/time-tracking' },
  { id: 'site', label: 'Plats', icon: MapPin, href: '/projects' },
  { id: 'crew', label: 'Team', icon: Users, href: '/employees' },
];

/**
 * MobileBottomTabBar - Field-First Design System
 * 
 * 3-tab bottom navigation optimized for field workers:
 * - Uppgifter (Tasks) - Time tracking
 * - Plats (Site) - Projects
 * - Team (Crew) - Employees
 * 
 * Features:
 * - 64px touch targets
 * - High-vis orange active state
 * - Safe area support for iPhone notch
 * - Replaces hamburger menu on mobile
 */
export function MobileBottomTabBar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/time-tracking') {
      return pathname === '/time-tracking' || pathname?.startsWith('/time-tracking/');
    }
    if (href === '/projects') {
      return pathname === '/projects' || pathname?.startsWith('/projects/');
    }
    if (href === '/employees') {
      return pathname === '/employees' || pathname?.startsWith('/employees/');
    }
    return pathname === href;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t-2 border-gray-900 dark:border-gray-100 md:hidden safe-area-pb"
      role="navigation"
      aria-label="Huvudnavigering"
    >
      <div className="flex">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`
                field-tab
                ${active ? 'field-tab-active' : 'field-tab-inactive'}
              `}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="w-6 h-6" />
              <span className="text-sm font-semibold mt-1">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileBottomTabBar;
