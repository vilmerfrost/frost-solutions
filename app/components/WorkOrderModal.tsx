// app/components/WorkOrderModal.tsx

'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useCreateWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import { X, Loader2 } from 'lucide-react';
import { CreateWorkOrderSchema, UpdateWorkOrderSchema } from '@/lib/schemas/work-order';
import type { WorkOrder, WorkOrderPriority, CreateWorkOrderRequest, UpdateWorkOrderRequest } from '@/types/work-orders';

interface WorkOrderModalProps {
 isOpen: boolean;
 onClose: () => void;
 workOrder?: WorkOrder | null; // För redigering
}

// Konvertera ISO-sträng till "YYYY-MM-DD"
const toInputDate = (isoString?: string | null): string => {
 if (!isoString) return '';
 try {
  return isoString.split('T')[0];
 } catch (e) { 
  return ''; 
 }
};

export function WorkOrderModal({ isOpen, onClose, workOrder }: WorkOrderModalProps) {
 // Form state (med useState som krävt)
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [projectId, setProjectId] = useState('');
 const [assignedTo, setAssignedTo] = useState('');
 const [priority, setPriority] = useState<WorkOrderPriority>('medium');
 const [scheduledDate, setScheduledDate] = useState('');
 
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 
 const { data: employees, isLoading: isLoadingEmployees } = useEmployees();
 const { data: projects, isLoading: isLoadingProjects } = useProjects();
 
 const createWorkOrder = useCreateWorkOrder();
 const updateWorkOrder = useUpdateWorkOrder();

 // Fyll formuläret vid redigering
 useEffect(() => {
  if (workOrder) {
   setTitle(workOrder.title);
   setDescription(workOrder.description || '');
   setProjectId(workOrder.project_id || '');
   setAssignedTo(workOrder.assigned_to || '');
   setPriority(workOrder.priority);
   setScheduledDate(toInputDate(workOrder.scheduled_date));
  } else {
   // Återställ vid "Skapa ny"
   setTitle('');
   setDescription('');
   setProjectId('');
   setAssignedTo('');
   setPriority('medium');
   setScheduledDate('');
  }
  setError(null);
 }, [workOrder, isOpen]);

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  const formData = {
   title,
   description: description || null,
   project_id: projectId || null,
   assigned_to: assignedTo || null,
   priority,
   scheduled_date: scheduledDate || null,
  };
  
  // Zod-validering
  const schema = workOrder ? UpdateWorkOrderSchema : CreateWorkOrderSchema;
  const validationResult = schema.safeParse(formData);
  
  if (!validationResult.success) {
   const firstError = validationResult.error.issues[0]?.message || 'Ogiltig indata';
   setError(firstError);
   toast.error(firstError);
   setIsLoading(false);
   return;
  }

  try {
   if (workOrder) {
    // Uppdatera
    await updateWorkOrder.mutateAsync({
     id: workOrder.id,
     ...validationResult.data as UpdateWorkOrderRequest,
    });
   } else {
    // Skapa - ensure title is provided
    const createData = validationResult.data as CreateWorkOrderRequest;
    if (!createData.title) {
     throw new Error('Titel krävs');
    }
    await createWorkOrder.mutateAsync(createData);
   }
   onClose(); // Stäng modalen vid framgång
  } catch (err) {
   const message = extractErrorMessage(err);
   setError(message);
   // Toast visas redan av hooken
  } finally {
   setIsLoading(false);
  }
 };

 if (!isOpen) return null;

 return (
  <>
   {/* Backdrop */}
   <div
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={onClose}
    aria-hidden="true"
   />
   
   {/* Responsive Modal Container */}
   <div 
    className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="modal-title-wo"
   >
    <div 
     className="bg-gray-50 dark:bg-gray-900 rounded-t-2xl sm:rounded-[8px] shadow-2xl max-w-lg w-full max-h-[90vh] sm:max-h-none flex flex-col"
    >
     {/* Modal Header */}
     <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
      <h2 id="modal-title-wo" className="text-xl font-semibold text-gray-900 dark:text-white">
       {workOrder ? 'Redigera Arbetsorder' : 'Skapa Arbetsorder'}
      </h2>
      <button
       type="button"
       onClick={onClose}
       className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] flex items-center justify-center"
       aria-label="Stäng modal"
      >
       <X className="w-5 h-5" />
      </button>
     </div>
     
     {/* Modal Body (Form) */}
     <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-grow">
      {error && (
       <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
        {error}
       </div>
      )}
      
      <div>
       <label htmlFor="wo_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Titel *
       </label>
       <input 
        type="text"
        id="wo_title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[44px] px-3"
       />
      </div>
      
      <div>
       <label htmlFor="wo_desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Beskrivning
       </label>
       <textarea 
        id="wo_desc"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={4}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[44px] px-3 py-2"
       />
      </div>
      
      {/* Projekt */}
      <div>
       <label htmlFor="wo_project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Projekt
       </label>
       <select 
        id="wo_project"
        value={projectId} 
        onChange={(e) => setProjectId(e.target.value)}
        disabled={isLoadingProjects}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[44px] px-3"
       >
        <option value="">{isLoadingProjects ? 'Laddar...' : projects && projects.length === 0 ? 'Inga projekt tillgängliga' : 'Inget projekt'}</option>
        {projects && projects.length > 0 ? (
         projects.map(proj => (
          <option key={proj.id} value={proj.id}>{proj.name}</option>
         ))
        ) : (
         !isLoadingProjects && <option value="" disabled>Inga projekt tillgängliga</option>
        )}
       </select>
       {!isLoadingProjects && projects && projects.length === 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
         Skapa ett projekt först för att koppla det till arbetsordern
        </p>
       )}
      </div>
      
      {/* Tilldelad */}
      <div>
       <label htmlFor="wo_assigned" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Tilldelad till
       </label>
       <select 
        id="wo_assigned"
        value={assignedTo} 
        onChange={(e) => setAssignedTo(e.target.value)}
        disabled={isLoadingEmployees}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[44px] px-3"
       >
        <option value="">{isLoadingEmployees ? 'Laddar...' : employees && employees.length === 0 ? 'Inga anställda tillgängliga' : 'Ej tilldelad'}</option>
        {employees && employees.length > 0 ? (
         employees.map(emp => (
          <option key={emp.id} value={emp.id}>{emp.full_name || emp.name || emp.email}</option>
         ))
        ) : (
         !isLoadingEmployees && <option value="" disabled>Inga anställda tillgängliga</option>
        )}
       </select>
       {!isLoadingEmployees && employees && employees.length === 0 && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
         Lägg till anställda först för att kunna tilldela arbetsordrar
        </p>
       )}
      </div>
      
      {/* Status info (read-only, auto-set) */}
      {!workOrder && (
       <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
         <strong>Status:</strong> Ny arbetsorder får automatiskt status "Ny" när den skapas.
        </p>
       </div>
      )}
      
      {/* Prioritet & Datum (Grid) */}
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label htmlFor="wo_priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
         Prioritet
        </label>
        <select 
         id="wo_priority"
         value={priority} 
         onChange={(e) => setPriority(e.target.value as WorkOrderPriority)}
         className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[44px] px-3"
        >
         <option value="low">Låg</option>
         <option value="medium">Medium</option>
         <option value="high">Hög</option>
         <option value="critical">Kritisk</option>
        </select>
       </div>
       <div>
        <label htmlFor="wo_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
         Planerat datum
        </label>
        <input 
         type="date"
         id="wo_date"
         value={scheduledDate}
         onChange={(e) => setScheduledDate(e.target.value)}
         className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 min-h-[44px] px-3"
        />
       </div>
      </div>
     </form>
     
     {/* Modal Footer (Knappar) */}
     <div className="flex justify-end space-x-3 p-4 border-t dark:border-gray-700">
      <button
       type="button"
       onClick={onClose}
       disabled={isLoading}
       className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 min-h-[44px]"
      >
       Avbryt
      </button>
      <button
       type="submit"
       onClick={handleSubmit}
       disabled={isLoading}
       className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 min-h-[44px] min-w-[80px] flex items-center justify-center disabled:opacity-50"
      >
       {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Spara'}
      </button>
     </div>
    </div>
   </div>
  </>
 );
}
