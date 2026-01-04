// app/components/WorkOrderStatusBadge.tsx

'use client';

import type { WorkOrderStatus } from '@/lib/work-order-state-machine';
import { 
 ClipboardList, 
 User, 
 Wrench, 
 Hand, 
 Check, 
 CheckCheck,
 type LucideIcon
} from 'lucide-react';

type StatusConfig = {
 [key in WorkOrderStatus]: {
  label: string;
  bgColor: string;
  textColor: string;
  icon: LucideIcon;
 }
};

// Design system-mappning
const statusConfig: StatusConfig = {
 'new': { 
  label: 'Ny', 
  bgColor: 'bg-slate-100 dark:bg-slate-700', 
  textColor: 'text-slate-700 dark:text-slate-200', 
  icon: ClipboardList 
 },
 'assigned': { 
  label: 'Tilldelad', 
  bgColor: 'bg-blue-100 dark:bg-blue-700', 
  textColor: 'text-blue-700 dark:text-blue-200', 
  icon: User 
 },
 'in_progress': { 
  label: 'Pågående', 
  bgColor: 'bg-amber-100 dark:bg-amber-700', 
  textColor: 'text-amber-700 dark:text-amber-200', 
  icon: Wrench 
 },
 'awaiting_approval': { 
  label: 'Väntar', 
  bgColor: 'bg-purple-100 dark:bg-purple-700', 
  textColor: 'text-purple-700 dark:text-purple-200', 
  icon: Hand 
 },
 'approved': { 
  label: 'Godkänd', 
  bgColor: 'bg-green-100 dark:bg-green-700', 
  textColor: 'text-green-700 dark:text-green-200', 
  icon: Check 
 },
 'completed': { 
  label: 'Slutförd', 
  bgColor: 'bg-green-200 dark:bg-green-800', 
  textColor: 'text-green-800 dark:text-green-100', 
  icon: CheckCheck 
 },
};

interface WorkOrderStatusBadgeProps {
 status: WorkOrderStatus;
}

export function WorkOrderStatusBadge({ status }: WorkOrderStatusBadgeProps) {
 const config = statusConfig[status] || statusConfig['new'];
 const Icon = config.icon;

 return (
  <span
   className={`inline-flex items-center gap-x-1.5 rounded-full px-2 py-1 text-xs font-medium ${config.bgColor} ${config.textColor}`}
  >
   <Icon className="h-3.5 w-3.5" />
   {config.label}
  </span>
 );
}
