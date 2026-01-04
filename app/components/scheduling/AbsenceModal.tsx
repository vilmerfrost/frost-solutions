// app/components/scheduling/AbsenceModal.tsx
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import type { Absence } from '@/types/scheduling';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateAbsence, useUpdateAbsence } from '@/hooks/useAbsences';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import { X } from 'lucide-react';

interface AbsenceModalProps {
 isOpen: boolean;
 onClose: () => void;
 absence?: Absence | null;
}

// Konvertera ISO-sträng till "YYYY-MM-DD"
const toInputDate = (isoString: string): string => {
 try {
  return isoString.split('T')[0];
 } catch (e) {
  return '';
 }
};

// Konvertera "YYYY-MM-DD" till ISO-sträng (YYYY-MM-DD format för backend)
const toISOString = (dateString: string): string => {
 // Backend förväntar sig YYYY-MM-DD format, inte ISO timestamp
 return dateString; // Redan i rätt format
};

export function AbsenceModal({ isOpen, onClose, absence }: AbsenceModalProps) {
 
 // Form state
 const [employeeId, setEmployeeId] = useState('');
 const [startDate, setStartDate] = useState('');
 const [endDate, setEndDate] = useState('');
 const [type, setType] = useState<Absence['type']>('sick');
 const [reason, setReason] = useState('');
 const [status, setStatus] = useState<Absence['status']>('pending');
 
 // Async state
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const { data: employees, isLoading: isLoadingEmployees } = useEmployees();
 
 const createAbsence = useCreateAbsence();
 const updateAbsence = useUpdateAbsence();

 useEffect(() => {
  if (absence) {
   // Redigeringsläge
   setEmployeeId(absence.employee_id);
   setStartDate(toInputDate(absence.start_date));
   setEndDate(toInputDate(absence.end_date));
   setType(absence.type);
   setReason(absence.reason || '');
   setStatus(absence.status);
  } else {
   // Skapa-läge
   setEmployeeId('');
   const today = new Date();
   setStartDate(toInputDate(today.toISOString()));
   setEndDate(toInputDate(today.toISOString()));
   setType('sick');
   setReason('');
   setStatus('pending');
  }
  setError(null);
 }, [absence, isOpen]);

 const validateForm = (): boolean => {
  setError(null);
  if (!employeeId || !startDate || !endDate) {
   setError('Anställd och datum är obligatoriska.');
   return false;
  }
  if (new Date(startDate) > new Date(endDate)) {
   setError('Slutdatum kan inte vara före startdatum.');
   return false;
  }
  return true;
 };

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setIsLoading(true);

  try {
   if (absence) {
    // Uppdatera
    const payload = {
     id: absence.id,
     start_date: toISOString(startDate),
     end_date: toISOString(endDate),
     type: type,
     status: status,
     reason: reason || undefined,
    };
    await updateAbsence.mutateAsync(payload);
    // Toast handled by hook
   } else {
    // Skapa - AbsenceInput tar INTE status (auto-sätts till pending)
    const payload = {
     employee_id: employeeId,
     start_date: toISOString(startDate),
     end_date: toISOString(endDate),
     type: type,
     reason: reason || undefined,
    };
    await createAbsence.mutateAsync(payload);
    // Toast handled by hook
   }
   onClose();
  } catch (err) {
   const message = extractErrorMessage(err);
   setError(message);
   toast.error(`Fel: ${message}`);
  } finally {
   setIsLoading(false);
  }
 };

 // Följer exakt modal-mönster
 if (!isOpen) return null;
 
 return (
  <>
   {/* Backdrop */}
   <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} aria-hidden="true" />
   {/* Modal - Mobile optimized */}
   <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div 
     className="bg-gray-50 dark:bg-gray-900 rounded-t-2xl sm:rounded-[8px] shadow-2xl max-w-md w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:max-w-md"
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title-absence"
    >
     {/* Header */}
     <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
      <h2 id="modal-title-absence" className="text-xl font-semibold text-gray-900 dark:text-white">
       {absence ? 'Redigera frånvaro' : 'Registrera frånvaro'}
      </h2>
      <button
       type="button"
       onClick={onClose}
       className="p-1 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
       aria-label="Stäng modal"
      >
       <X className="w-5 h-5" />
      </button>
     </div>
     
     {/* Form */}
     <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
      {error && (
       <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
        {error}
       </div>
      )}
      
      {/* Anställd */}
      <div>
       <label htmlFor="employee_id_absence" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anställd</label>
       <select 
        id="employee_id_absence"
        value={employeeId} 
        onChange={(e) => setEmployeeId(e.target.value)}
        disabled={isLoadingEmployees}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       >
        <option value="">{isLoadingEmployees ? 'Laddar...' : 'Välj anställd'}</option>
        {employees?.map(emp => (
         <option key={emp.id} value={emp.id}>{emp.full_name}</option>
        ))}
       </select>
      </div>
      
      {/* Typ */}
      <div>
       <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Typ</label>
       <select 
        id="type"
        value={type} 
        onChange={(e) => setType(e.target.value as Absence['type'])}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       >
        <option value="sick">Sjuk</option>
        <option value="vacation">Semester</option>
        <option value="other">Övrigt</option>
       </select>
      </div>

      {/* Startdatum */}
      <div>
       <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Startdatum</label>
       <input 
        type="date"
        id="start_date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       />
      </div>
      
      {/* Slutdatum */}
      <div>
       <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slutdatum</label>
       <input 
        type="date"
        id="end_date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       />
      </div>
      
      {/* Anledning */}
      <div>
       <label htmlFor="reason" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anledning (valfri)</label>
       <textarea 
        id="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       />
      </div>
      
      {/* Status (endast vid redigering) */}
      {absence && (
       <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
        <select 
         id="status"
         value={status} 
         onChange={(e) => setStatus(e.target.value as Absence['status'])}
         className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
         <option value="pending">Väntande</option>
         <option value="approved">Godkänd</option>
         <option value="rejected">Avslagen</option>
        </select>
       </div>
      )}
      
      {/* Knappar */}
      <div className="flex justify-end space-x-3 pt-2 flex-shrink-0">
       <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
       >
        Avbryt
       </button>
       <button
        type="submit"
        disabled={isLoading}
        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
       >
        {isLoading ? 'Sparar...' : 'Spara'}
       </button>
      </div>
     </form>
    </div>
   </div>
  </>
 );
}

