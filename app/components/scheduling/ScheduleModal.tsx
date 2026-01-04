// app/components/scheduling/ScheduleModal.tsx
"use client";

import React, { useState, useEffect, FormEvent } from 'react';
import type { ScheduleSlot, ScheduleFilters, CreateScheduleRequest, UpdateScheduleRequest, ShiftType } from '@/types/scheduling';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { 
 useCreateSchedule, 
 useUpdateSchedule, 
 useScheduleConflicts 
} from '@/hooks/useSchedules';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import { X, Clock, Plus, Trash2 } from 'lucide-react';

interface ScheduleModalProps {
 isOpen: boolean;
 onClose: () => void;
 schedule?: ScheduleSlot | null; // För redigering
 filters: ScheduleFilters; // För query invalidation
 // Valfria standardvärden när man klickar i kalendern
 defaultStartTime?: string; // ISO string for date/time
 defaultEmployeeId?: string;
}

// Konvertera ISO-sträng till formatet "YYYY-MM-DDTHH:mm" som krävs av datetime-local
const toDateTimeLocal = (isoString: string): string => {
 try {
  const date = new Date(isoString);
  // Justera för tidszon
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
  return localISOTime;
 } catch (e) {
  return ''; // Hantera ogiltigt datum
 }
};

// Konvertera datetime-local sträng till ISO-sträng
const toISOString = (localDateTime: string): string => {
 if (!localDateTime) return '';
 const localDate = new Date(localDateTime);
 if (isNaN(localDate.getTime())) return '';
 return localDate.toISOString();
};

// Hjälpfunktion för att få standardtider baserat på shift_type
const getDefaultTimes = (shiftType: ShiftType, date: Date): { start: string; end: string } => {
 const year = date.getFullYear();
 const month = String(date.getMonth() + 1).padStart(2, '0');
 const day = String(date.getDate()).padStart(2, '0');
 
 switch (shiftType) {
  case 'day':
   return {
    start: `${year}-${month}-${day}T08:00`,
    end: `${year}-${month}-${day}T16:00`,
   };
  case 'night':
   return {
    start: `${year}-${month}-${day}T22:00`,
    end: `${year}-${month}-${day}T06:00`, // Nästa dag
   };
  case 'evening':
   return {
    start: `${year}-${month}-${day}T18:00`,
    end: `${year}-${month}-${day}T22:00`,
   };
  case 'weekend':
   return {
    start: `${year}-${month}-${day}T08:00`,
    end: `${year}-${month}-${day}T16:00`,
   };
  default:
   return {
    start: `${year}-${month}-${day}T08:00`,
    end: `${year}-${month}-${day}T16:00`,
   };
 }
};

export function ScheduleModal({ 
 isOpen, 
 onClose, 
 schedule, 
 filters, 
 defaultStartTime, 
 defaultEmployeeId 
}: ScheduleModalProps) {
 
 // Form state
 const [employeeId, setEmployeeId] = useState('');
 const [projectId, setProjectId] = useState('');
 const [startTime, setStartTime] = useState('');
 const [endTime, setEndTime] = useState('');
 const [shiftType, setShiftType] = useState<ShiftType>('day');
 const [transportTimeMinutes, setTransportTimeMinutes] = useState<number>(0);
 const [status, setStatus] = useState<ScheduleSlot['status']>('scheduled');
 const [notes, setNotes] = useState('');
 
 // Multiple projects for same day
 const [multipleProjects, setMultipleProjects] = useState(false);
 const [projectSlots, setProjectSlots] = useState<Array<{
  projectId: string;
  startTime: string;
  endTime: string;
  transportTimeMinutes: number;
 }>>([{ projectId: '', startTime: '', endTime: '', transportTimeMinutes: 0 }]);
 
 // Async state
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // Hämta data för dropdowns
 const { data: employees, isLoading: isLoadingEmployees } = useEmployees();
 const { data: projects, isLoading: isLoadingProjects } = useProjects();
 
 // Mutation hooks
 const createSchedule = useCreateSchedule(filters);
 const updateSchedule = useUpdateSchedule(filters);
 const checkConflicts = useScheduleConflicts();

 // Effekt för att fylla formuläret vid redigering eller med standardvärden
 useEffect(() => {
  if (schedule) {
   // Redigeringsläge - endast ett projekt
   setEmployeeId(schedule.employee_id);
   setProjectId(schedule.project_id);
   setStartTime(toDateTimeLocal(schedule.start_time));
   setEndTime(toDateTimeLocal(schedule.end_time));
   setStatus(schedule.status);
   setShiftType(schedule.shift_type || 'day');
   setTransportTimeMinutes(schedule.transport_time_minutes || 0);
   setNotes(schedule.notes || '');
   setMultipleProjects(false);
   setProjectSlots([{ projectId: schedule.project_id, startTime: toDateTimeLocal(schedule.start_time), endTime: toDateTimeLocal(schedule.end_time), transportTimeMinutes: schedule.transport_time_minutes || 0 }]);
  } else {
   // Skapa-läge
   setEmployeeId(defaultEmployeeId || '');
   setStatus('scheduled');
   setShiftType('day');
   setTransportTimeMinutes(0);
   setNotes('');
   setMultipleProjects(false);
   
   // Om defaultStartTime är satt, använd samma datum och sätt standardtider baserat på shift_type
   if (defaultStartTime) {
    const startDate = new Date(defaultStartTime);
    const times = getDefaultTimes('day', startDate); // Alltid starta med 'day' som default
    setStartTime(times.start);
    setEndTime(times.end);
    setProjectSlots([{ projectId: '', startTime: times.start, endTime: times.end, transportTimeMinutes: 0 }]);
   } else {
    // Annars sätt till idag med standardtider
    const today = new Date();
    const times = getDefaultTimes('day', today);
    setStartTime(times.start);
    setEndTime(times.end);
    setProjectSlots([{ projectId: '', startTime: times.start, endTime: times.end, transportTimeMinutes: 0 }]);
   }
  }
  setError(null);
 }, [schedule, isOpen, defaultStartTime, defaultEmployeeId]);

 // Uppdatera tider när shift_type ändras (endast i skapa-läge och när startTime redan är satt)
 useEffect(() => {
  if (!schedule && startTime && !defaultStartTime && !multipleProjects) {
   // Endast uppdatera om vi inte har ett defaultStartTime (för att undvika att skriva över det)
   const startDate = new Date(startTime);
   const times = getDefaultTimes(shiftType, startDate);
   setStartTime(times.start);
   setEndTime(times.end);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [shiftType, schedule, defaultStartTime, multipleProjects]);

 // När multipleProjects ändras, uppdatera projectSlots
 useEffect(() => {
  if (multipleProjects && projectSlots.length === 1 && projectSlots[0].projectId === '') {
   // Lägg till ytterligare ett tomt slot
   setProjectSlots([
    { projectId: '', startTime: startTime || '', endTime: endTime || '', transportTimeMinutes: 0 },
    { projectId: '', startTime: '', endTime: '', transportTimeMinutes: 0 }
   ]);
  } else if (!multipleProjects && projectSlots.length > 1) {
   // Återgå till enstaka projekt
   setProjectSlots([projectSlots[0] || { projectId: '', startTime: startTime || '', endTime: endTime || '', transportTimeMinutes: 0 }]);
   setProjectId(projectSlots[0]?.projectId || '');
   setStartTime(projectSlots[0]?.startTime || '');
   setEndTime(projectSlots[0]?.endTime || '');
   setTransportTimeMinutes(projectSlots[0]?.transportTimeMinutes || 0);
  }
 }, [multipleProjects]);

 const addProjectSlot = () => {
  setProjectSlots([...projectSlots, { projectId: '', startTime: '', endTime: '', transportTimeMinutes: 0 }]);
 };

 const removeProjectSlot = (index: number) => {
  if (projectSlots.length > 1) {
   setProjectSlots(projectSlots.filter((_, i) => i !== index));
  }
 };

 const updateProjectSlot = (index: number, field: string, value: any) => {
  const updated = [...projectSlots];
  updated[index] = { ...updated[index], [field]: value };
  setProjectSlots(updated);
  
  // Om vi är i single-project mode, uppdatera huvudfälten också
  if (!multipleProjects && index === 0) {
   if (field === 'projectId') setProjectId(value);
   if (field === 'startTime') setStartTime(value);
   if (field === 'endTime') setEndTime(value);
   if (field === 'transportTimeMinutes') setTransportTimeMinutes(value);
  }
 };

 const validateForm = (): boolean => {
  setError(null);
  
  if (!employeeId) {
   setError('Anställd måste väljas.');
   return false;
  }

  if (multipleProjects) {
   // Validera alla projekt-slots
   for (let i = 0; i < projectSlots.length; i++) {
    const slot = projectSlots[i];
    if (!slot.projectId || !slot.startTime || !slot.endTime) {
     setError(`Alla fält måste fyllas i för projekt ${i + 1}.`);
     return false;
    }
    const start = new Date(slot.startTime);
    const end = new Date(slot.endTime);
    if (start >= end) {
     setError(`Sluttid måste vara efter starttid för projekt ${i + 1}.`);
     return false;
    }
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (durationHours > 12) {
     setError(`Projekt ${i + 1} kan inte vara längre än 12 timmar.`);
     return false;
    }
   }
  } else {
   // Validera enstaka projekt
   if (!projectId || !startTime || !endTime) {
    setError('Alla fält (utom anteckningar och transporttid) är obligatoriska.');
    return false;
   }
   const start = new Date(startTime);
   const end = new Date(endTime);
   if (start >= end) {
    setError('Sluttid måste vara efter starttid.');
    return false;
   }
   const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
   if (durationHours > 12) {
    setError('Ett arbetspass kan inte vara längre än 12 timmar.');
    return false;
   }
   if (transportTimeMinutes < 0 || transportTimeMinutes > 480) {
    setError('Transporttid måste vara mellan 0 och 480 minuter.');
    return false;
   }
  }
  
  return true;
 };

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (!validateForm()) return;
  
  setIsLoading(true);

  try {
   if (multipleProjects) {
    // Skapa flera scheman för olika projekt samma dag
    const date = projectSlots[0].startTime.split('T')[0];
    
    for (let i = 0; i < projectSlots.length; i++) {
     const slot = projectSlots[i];
     const isoStartTime = toISOString(slot.startTime);
     const isoEndTime = toISOString(slot.endTime);

     // Kontrollera konflikter för varje slot
     const conflictResult = await checkConflicts.mutateAsync({
      employee_id: employeeId,
      start_time: isoStartTime,
      end_time: isoEndTime,
      exclude_id: schedule?.id,
     });

     if (conflictResult.hasConflict) {
      setError(`Projekt ${i + 1} skapar en konflikt med ett befintligt pass.`);
      setIsLoading(false);
      return;
     }

     const payload: CreateScheduleRequest = {
      employee_id: employeeId,
      project_id: slot.projectId,
      start_time: isoStartTime,
      end_time: isoEndTime,
      status: status,
      shift_type: shiftType,
      transport_time_minutes: slot.transportTimeMinutes > 0 ? slot.transportTimeMinutes : undefined,
      notes: i === 0 ? notes : undefined, // Lägg bara notes på första passet
     };
     
     await createSchedule.mutateAsync(payload);
    }
    
    toast.success(`${projectSlots.length} pass skapade för ${date}`);
   } else {
    // Enstaka projekt (som tidigare)
    const isoStartTime = toISOString(startTime);
    const isoEndTime = toISOString(endTime);

    // 1. Kontrollera konflikter innan submit
    const conflictResult = await checkConflicts.mutateAsync({
     employee_id: employeeId,
     start_time: isoStartTime,
     end_time: isoEndTime,
     exclude_id: schedule?.id,
    });

    if (conflictResult.hasConflict) {
     setError(conflictResult.conflicts?.length ? 'Detta pass krockar med ett befintligt pass.' : 'Konflikt upptäckt.');
     setIsLoading(false);
     return;
    }

    // 2. Skapa eller uppdatera
    if (schedule) {
     const payload: UpdateScheduleRequest & { id: string } = {
      id: schedule.id,
      employee_id: employeeId,
      project_id: projectId,
      start_time: isoStartTime,
      end_time: isoEndTime,
      status: status,
      shift_type: shiftType,
      transport_time_minutes: transportTimeMinutes > 0 ? transportTimeMinutes : undefined,
      notes: notes,
     };
     await updateSchedule.mutateAsync(payload);
    } else {
     const payload: CreateScheduleRequest = {
      employee_id: employeeId,
      project_id: projectId,
      start_time: isoStartTime,
      end_time: isoEndTime,
      status: status,
      shift_type: shiftType,
      transport_time_minutes: transportTimeMinutes > 0 ? transportTimeMinutes : undefined,
      notes: notes,
     };
     await createSchedule.mutateAsync(payload);
    }
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

 if (!isOpen) return null;

 return (
  <>
   {/* Backdrop */}
   <div
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={onClose}
    aria-hidden="true"
   />
   
   {/* Modal - Mobile optimized */}
   <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
    <div 
     className="bg-gray-50 dark:bg-gray-900 rounded-t-2xl sm:rounded-[8px] shadow-2xl max-w-md w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col sm:max-w-md"
     role="dialog"
     aria-modal="true"
     aria-labelledby="modal-title"
    >
     {/* Modal Header */}
     <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 flex-shrink-0">
      <h2 id="modal-title" className="text-xl font-semibold text-gray-900 dark:text-white">
       {schedule ? 'Redigera schemapass' : 'Skapa schemapass'}
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

     {/* Modal Body (Form) */}
     <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
      {error && (
       <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
        {error}
       </div>
      )}
      
      {/* Anställd */}
      <div>
       <label htmlFor="employee_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Anställd <span className="text-red-500">*</span>
       </label>
       <select 
        id="employee_id"
        value={employeeId} 
        onChange={(e) => setEmployeeId(e.target.value)}
        disabled={isLoadingEmployees}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
        required
       >
        <option value="">{isLoadingEmployees ? 'Laddar...' : 'Välj anställd'}</option>
        {employees && employees.length > 0 ? (
         employees.map(emp => (
          <option key={emp.id} value={emp.id}>
           {emp.full_name || emp.name || emp.email || emp.id}
          </option>
         ))
        ) : (
         <option value="" disabled>
          {isLoadingEmployees ? 'Laddar anställda...' : 'Inga anställda hittades'}
         </option>
        )}
       </select>
      </div>

      {/* Checkbox för flera projekt */}
      {!schedule && (
       <div className="flex items-center">
        <input
         type="checkbox"
         id="multiple_projects"
         checked={multipleProjects}
         onChange={(e) => setMultipleProjects(e.target.checked)}
         className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="multiple_projects" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
         Schema lägga på flera projekt samma dag
        </label>
       </div>
      )}

      {multipleProjects ? (
       // Flera projekt-läge
       <div className="space-y-4">
        {projectSlots.map((slot, index) => (
         <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-3">
           <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Projekt {index + 1}
           </h3>
           {projectSlots.length > 1 && (
            <button
             type="button"
             onClick={() => removeProjectSlot(index)}
             className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
             <Trash2 className="w-4 h-4" />
            </button>
           )}
          </div>

          {/* Projekt */}
          <div className="mb-3">
           <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Projekt <span className="text-red-500">*</span>
           </label>
           <select 
            value={slot.projectId} 
            onChange={(e) => updateProjectSlot(index, 'projectId', e.target.value)}
            disabled={isLoadingProjects}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            required
           >
            <option value="">Välj projekt</option>
            {projects?.map(proj => (
             <option key={proj.id} value={proj.id}>{proj.name}</option>
            ))}
           </select>
          </div>

          {/* Starttid */}
          <div className="mb-3">
           <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Starttid <span className="text-red-500">*</span>
           </label>
           <input 
            type="datetime-local"
            value={slot.startTime}
            onChange={(e) => updateProjectSlot(index, 'startTime', e.target.value)}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            required
           />
          </div>

          {/* Sluttid */}
          <div className="mb-3">
           <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sluttid <span className="text-red-500">*</span>
           </label>
           <input 
            type="datetime-local"
            value={slot.endTime}
            onChange={(e) => updateProjectSlot(index, 'endTime', e.target.value)}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            required
           />
          </div>

          {/* Transporttid */}
          <div>
           <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
            <Clock className="w-3 h-3" />
            Transporttid (minuter)
           </label>
           <input 
            type="number"
            min="0"
            max="480"
            value={slot.transportTimeMinutes}
            onChange={(e) => updateProjectSlot(index, 'transportTimeMinutes', parseInt(e.target.value) || 0)}
            className="block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
            placeholder="0"
           />
          </div>
         </div>
        ))}
        
        <button
         type="button"
         onClick={addProjectSlot}
         className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30"
        >
         <Plus className="w-4 h-4" />
         Lägg till ytterligare projekt
        </button>
       </div>
      ) : (
       // Enstaka projekt-läge
       <>
        {/* Projekt */}
        <div>
         <label htmlFor="project_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Projekt <span className="text-red-500">*</span>
         </label>
         <select 
          id="project_id"
          value={projectId} 
          onChange={(e) => setProjectId(e.target.value)}
          disabled={isLoadingProjects}
          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
         >
          <option value="">{isLoadingProjects ? 'Laddar...' : 'Välj projekt'}</option>
          {projects?.map(proj => (
           <option key={proj.id} value={proj.id}>{proj.name}</option>
          ))}
         </select>
        </div>

        {/* Typ av pass */}
        <div>
         <label htmlFor="shift_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Typ av pass
         </label>
         <select 
          id="shift_type"
          value={shiftType} 
          onChange={(e) => setShiftType(e.target.value as ShiftType)}
          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
         >
          <option value="day">Dagtid (08:00-16:00)</option>
          <option value="evening">Kväll (18:00-22:00)</option>
          <option value="night">Natt (22:00-06:00)</option>
          <option value="weekend">Helg</option>
          <option value="other">Annat</option>
         </select>
        </div>

        {/* Starttid */}
        <div>
         <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Starttid <span className="text-red-500">*</span>
         </label>
         <input 
          type="datetime-local"
          id="start_time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
         />
        </div>
        
        {/* Sluttid */}
        <div>
         <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Sluttid <span className="text-red-500">*</span>
         </label>
         <input 
          type="datetime-local"
          id="end_time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
         />
        </div>

        {/* Transporttid */}
        <div>
         <label htmlFor="transport_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Transporttid (minuter)
         </label>
         <input 
          type="number"
          id="transport_time"
          min="0"
          max="480"
          value={transportTimeMinutes}
          onChange={(e) => setTransportTimeMinutes(parseInt(e.target.value) || 0)}
          className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="0"
         />
         <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Ange transporttid i minuter (0-480)
         </p>
        </div>
       </>
      )}

      {/* Status */}
      <div>
       <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
       <select 
        id="status"
        value={status} 
        onChange={(e) => setStatus(e.target.value as ScheduleSlot['status'])}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       >
        <option value="scheduled">Schemalagd</option>
        <option value="confirmed">Bekräftad</option>
        <option value="completed">Slutförd</option>
        <option value="cancelled">Avbokad</option>
       </select>
      </div>

      {/* Anteckningar */}
      <div>
       <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Anteckningar</label>
       <textarea 
        id="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="mt-1 block w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500"
       />
      </div>
      
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
        {isLoading ? 'Sparar...' : (schedule ? 'Spara ändringar' : multipleProjects ? `Skapa ${projectSlots.length} pass` : 'Skapa pass')}
       </button>
      </div>
     </form>
    </div>
   </div>
  </>
 );
}
