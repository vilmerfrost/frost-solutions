// app/components/integrations/StatusBadge.tsx
"use client";

import type { IntegrationStatus } from '@/types/integrations';
import { CheckCircle, XCircle, PlugZap, AlertTriangle, Loader2 } from 'lucide-react';

interface StatusBadgeProps {
 status: IntegrationStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
 const configMap: Record<string, { icon: typeof CheckCircle; text: string; className: string }> = {
  connected: {
   icon: CheckCircle,
   text: 'Ansluten',
   className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  active: {
   icon: CheckCircle,
   text: 'Aktiv',
   className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  disconnected: {
   icon: PlugZap,
   text: 'Frånkopplad',
   className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  },
  error: {
   icon: XCircle,
   text: 'Fel',
   className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  expired: {
   icon: AlertTriangle,
   text: 'Utgången',
   className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  pending: {
   icon: Loader2,
   text: 'Väntar',
   className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  misconfigured: {
   icon: AlertTriangle,
   text: 'Konfig-fel',
   className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  },
  loading: {
   icon: Loader2,
   text: 'Laddar...',
   className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 animate-pulse',
  }
 };
 const config = configMap[status] || configMap['loading'];

 const Icon = config.icon;

 return (
  <span
   className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.className}`}
  >
   <Icon className={`w-4 h-4 ${status === 'pending' ? 'animate-spin' : ''}`} />
   {config.text}
  </span>
 );
}

