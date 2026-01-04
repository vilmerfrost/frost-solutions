// app/components/WorkOrderCard.tsx

'use client';

import Link from 'next/link';
import type { WorkOrder } from '@/types/work-orders';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import { WorkOrderPriorityIndicator } from './WorkOrderPriorityIndicator';
import { Image as ImageIcon, User, Briefcase, Calendar } from 'lucide-react';
import { useMemo } from 'react';

interface WorkOrderCardProps {
 workOrder: WorkOrder;
}

export function WorkOrderCard({ workOrder }: WorkOrderCardProps) {
 const { data: employees } = useEmployees();
 const { data: projects } = useProjects();

 // Berika data med namn
 const assignedEmployeeName = useMemo(() => 
  employees?.find(e => e.id === workOrder.assigned_to)?.full_name
 , [employees, workOrder.assigned_to]);
 
 const projectName = useMemo(() => 
  projects?.find(p => p.id === workOrder.project_id)?.name
 , [projects, workOrder.project_id]);

 const thumbnailUrl = workOrder.photos?.[0]?.thumbnail_url;
 
 const formattedDate = workOrder.scheduled_date 
  ? new Date(workOrder.scheduled_date).toLocaleDateString('sv-SE') 
  : null;

 return (
  <Link 
   href={`/work-orders/${workOrder.id}`} 
   className="block bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md hover:shadow-md transition-shadow border border-transparent dark:border-gray-700 hover:border-blue-500"
  >
   <div className="flex flex-col h-full">
    {thumbnailUrl && (
     <img 
      src={thumbnailUrl} 
      alt="Första fotot för arbetsorder" 
      className="w-full h-32 object-cover rounded-t-lg"
     />
    )}
    
    <div className="p-4 flex flex-col flex-grow">
     <div className="flex justify-between items-start gap-2">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
       #{workOrder.number}: {workOrder.title}
      </h3>
      <WorkOrderPriorityIndicator priority={workOrder.priority} />
     </div>
     
     <div className="mt-2">
      <WorkOrderStatusBadge status={workOrder.status} />
     </div>
     
     <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
      {projectName && (
       <div className="flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-gray-500" />
        <span>{projectName}</span>
       </div>
      )}
      {assignedEmployeeName && (
       <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-gray-500" />
        <span>{assignedEmployeeName}</span>
       </div>
      )}
      {formattedDate && (
       <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span>{formattedDate}</span>
       </div>
      )}
     </div>
     
     <div className="flex-grow" />
     
     <div className="mt-4 flex justify-between items-center text-xs text-gray-500">
      <span className="truncate">{workOrder.id}</span>
      {workOrder.photos && workOrder.photos.length > 0 && (
       <div className="flex items-center gap-1">
        <ImageIcon className="w-3 h-3" />
        <span>{workOrder.photos.length}</span>
       </div>
      )}
     </div>
    </div>
   </div>
  </Link>
 );
}

// Skeleton-komponent för laddning
export function WorkOrderCardSkeleton() {
 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md border dark:border-gray-700 p-4 animate-pulse">
   <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
   <div className="mt-4">
    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
    <div className="mt-2 h-4 w-1/4 bg-gray-200 dark:bg-gray-700 rounded-full" />
    <div className="mt-4 space-y-2">
     <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
     <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
   </div>
  </div>
 );
}
