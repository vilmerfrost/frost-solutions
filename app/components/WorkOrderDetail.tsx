// app/components/WorkOrderDetail.tsx

'use client';

import { useState } from 'react';
import { useWorkOrder, useDeleteWorkOrder, useWorkOrderStatusTransition } from '@/hooks/useWorkOrders';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useAdmin } from '@/hooks/useAdmin';
import { useUserRole } from '@/hooks/useUserRole';
import { WorkOrderStatusBadge } from './WorkOrderStatusBadge';
import { WorkOrderPriorityIndicator } from './WorkOrderPriorityIndicator';
import { WorkOrderPhotoUpload } from './WorkOrderPhotoUpload';
import { WorkOrderModal } from './WorkOrderModal';
import { Loader2, User, Briefcase, Calendar, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { WorkOrderStateMachine } from '@/lib/work-order-state-machine';
import type { WorkOrderStatus } from '@/lib/work-order-state-machine';
import { toast } from '@/lib/toast';

interface WorkOrderDetailProps {
 workOrderId: string;
}

// Status transition labels på svenska
const statusLabels: Record<WorkOrderStatus, string> = {
 'new': 'Ny',
 'assigned': 'Tilldelad',
 'in_progress': 'Pågående',
 'awaiting_approval': 'Väntar på godkännande',
 'approved': 'Godkänd',
 'completed': 'Slutförd',
};

export function WorkOrderDetail({ workOrderId }: WorkOrderDetailProps) {
 const router = useRouter();
 const [isEditModalOpen, setIsEditModalOpen] = useState(false);
 
 const { data: workOrder, isLoading, isError } = useWorkOrder(workOrderId);
 const { data: employees } = useEmployees();
 const { data: projects } = useProjects();
 const { isAdmin } = useAdmin();
 const { userRole } = useUserRole();
 
 const deleteWorkOrder = useDeleteWorkOrder();
 const changeStatus = useWorkOrderStatusTransition();
 
 // Berika data
 const assignedEmployeeName = employees?.find(e => e.id === workOrder?.assigned_to)?.full_name || 'Ej tilldelad';
 const projectName = projects?.find(p => p.id === workOrder?.project_id)?.name || 'Inget projekt';

 if (isLoading) {
  return (
   <div className="flex justify-center items-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
   </div>
  );
 }

 if (isError || !workOrder) {
  return (
   <div className="text-center text-red-500 py-8">
    Kunde inte ladda arbetsorder.
   </div>
  );
 }
 
 // Hämta giltiga statusövergångar
 const validTransitions = WorkOrderStateMachine.getValidTransitions(
  workOrder.status as WorkOrderStatus, 
  userRole
 );

 const handleDelete = async () => {
  if (window.confirm('Är du säker på att du vill ta bort denna arbetsorder?')) {
   try {
    await deleteWorkOrder.mutateAsync(workOrder.id);
    router.push('/work-orders');
   } catch (error) {
    // Error handled by hook via toast
   }
  }
 };

 const handleStatusChange = async (toStatus: WorkOrderStatus) => {
  try {
   await changeStatus.mutateAsync({ 
    id: workOrder.id, 
    to_status: toStatus 
   });
  } catch (error) {
   // Error handled by hook via toast
  }
 };

 return (
  <div className="max-w-4xl mx-auto space-y-6">
   {/* Tillbaka-knapp */}
   <button
    onClick={() => router.push('/work-orders')}
    className="mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors"
   >
    ← Tillbaka till arbetsordrar
   </button>

   {/* Header med titel och admin-knappar */}
   <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
    <div>
     <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
      #{workOrder.number}: {workOrder.title}
     </h1>
     <div className="mt-2 flex items-center gap-4 flex-wrap">
      <WorkOrderStatusBadge status={workOrder.status} />
      <WorkOrderPriorityIndicator priority={workOrder.priority} showLabel />
     </div>
    </div>
    {isAdmin && (
     <div className="flex space-x-2">
      <button
       onClick={() => setIsEditModalOpen(true)}
       className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 min-h-[44px]"
      >
       <Pencil className="w-4 h-4" />
       <span>Redigera</span>
      </button>
      <button
       onClick={handleDelete}
       disabled={deleteWorkOrder.isPending}
       className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 min-h-[44px] disabled:opacity-50"
      >
       <Trash2 className="w-4 h-4" />
       <span>Ta bort</span>
      </button>
     </div>
    )}
   </div>
   
   {/* Detaljer */}
   <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm">
    <h2 className="text-xl font-semibold mb-4">Detaljer</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700 dark:text-gray-300">
     <div className="flex items-center gap-2">
      <Briefcase className="w-5 h-5 text-gray-500" />
      <strong>Projekt:</strong> {projectName}
     </div>
     <div className="flex items-center gap-2">
      <User className="w-5 h-5 text-gray-500" />
      <strong>Tilldelad:</strong> {assignedEmployeeName}
     </div>
     <div className="flex items-center gap-2">
      <Calendar className="w-5 h-5 text-gray-500" />
      <strong>Planerat datum:</strong> {workOrder.scheduled_date ? new Date(workOrder.scheduled_date).toLocaleDateString('sv-SE') : 'Ej satt'}
     </div>
    </div>
    <div className="mt-4">
     <h3 className="font-semibold">Beskrivning</h3>
     <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
      {workOrder.description || 'Ingen beskrivning.'}
     </p>
    </div>
   </div>
   
   {/* Status-hantering - Förenklad och tydlig */}
   <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
    <div className="mb-6">
     <h2 className="text-xl font-semibold mb-2">Status</h2>
     <div className="flex items-center gap-3 mb-4">
      <WorkOrderStatusBadge status={workOrder.status} />
      <span className="text-sm text-gray-600 dark:text-gray-400">
       Arbetsordern är nu: <strong>{statusLabels[workOrder.status as WorkOrderStatus]}</strong>
      </span>
     </div>
    </div>

    {/* Nästa steg - Tydlig och enkel */}
    {validTransitions.length > 0 ? (
     <div>
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
       Nästa steg - Klicka på knappen för att ändra status:
      </h3>
      <div className="space-y-3">
       {validTransitions.map((transition) => (
        <button
         key={transition}
         onClick={() => handleStatusChange(transition)}
         disabled={changeStatus.isPending}
         className="w-full sm:w-auto min-w-[200px] px-6 py-3 text-base font-semibold rounded-lg shadow-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
         {changeStatus.isPending ? (
          <>
           <Loader2 className="w-5 h-5 animate-spin" />
           <span>Uppdaterar...</span>
          </>
         ) : (
          <span>→ {statusLabels[transition] || transition}</span>
         )}
        </button>
       ))}
      </div>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
       💡 Tip: Klicka på knappen ovan för att flytta arbetsordern till nästa steg i processen.
      </p>
     </div>
    ) : (
     <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <p className="text-sm text-blue-800 dark:text-blue-200">
       ✅ Arbetsordern är i status <strong>{statusLabels[workOrder.status as WorkOrderStatus]}</strong>.
       {workOrder.status === 'completed' 
        ? ' Denna arbetsorder är slutförd!' 
        : ' Du kan inte ändra status från detta läge med din nuvarande roll.'}
      </p>
     </div>
    )}
   </div>
   
   {/* Fotogalleri */}
   <WorkOrderPhotoUpload workOrderId={workOrderId} />
   
   {/* Redigeringsmodal */}
   <WorkOrderModal
    isOpen={isEditModalOpen}
    onClose={() => setIsEditModalOpen(false)}
    workOrder={workOrder}
   />
  </div>
 );
}
