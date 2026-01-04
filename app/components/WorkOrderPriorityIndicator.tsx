// app/components/WorkOrderPriorityIndicator.tsx

'use client';

import type { WorkOrderPriority } from '@/lib/work-order-state-machine';
import { CircleAlert, CircleArrowUp, Circle, CircleArrowDown } from 'lucide-react';

type PriorityConfig = {
 [key in WorkOrderPriority]: {
  label: string;
  icon: React.ReactNode;
 }
};

// Ikoner enligt spec
const priorityConfig: PriorityConfig = {
 'critical': { 
  label: 'Kritisk', 
  icon: <CircleAlert className="h-5 w-5 text-red-500" /> 
 },
 'high': { 
  label: 'Hög', 
  icon: <CircleArrowUp className="h-5 w-5 text-orange-500" /> 
 },
 'medium': { 
  label: 'Medel', 
  icon: <Circle className="h-5 w-5 text-yellow-500" /> 
 },
 'low': { 
  label: 'Låg', 
  icon: <CircleArrowDown className="h-5 w-5 text-blue-500" /> 
 },
};

interface WorkOrderPriorityIndicatorProps {
 priority: WorkOrderPriority;
 showLabel?: boolean;
}

export function WorkOrderPriorityIndicator({ priority, showLabel = false }: WorkOrderPriorityIndicatorProps) {
 const config = priorityConfig[priority] || priorityConfig['low'];

 return (
  <span className="flex items-center gap-1" title={config.label}>
   {config.icon}
   {showLabel && <span className="text-sm text-gray-700 dark:text-gray-300">{config.label}</span>}
  </span>
 );
}
