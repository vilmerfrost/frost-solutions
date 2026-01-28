// app/components/scheduling/ScheduleModal.tsx
"use client";

import React, { useState, useEffect, FormEvent, useMemo } from 'react';
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
import { X, Clock, Plus, Trash2, Calendar, Bell, AlertTriangle } from 'lucide-react';

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
 
 // Enhanced pattern fields
 type PatternType = 'single' | 'weekly' | 'recurring';
 const [patternType, setPatternType] = useState<PatternType>('single');
 const [patternStartDate, setPatternStartDate] = useState('');
 const [patternEndDate, setPatternEndDate] = useState('');
 const [workStartTime, setWorkStartTime] = useState('07:00');
 const [workEndTime, setWorkEndTime] = useState('16:00');
 const [breakMinutes, setBreakMinutes] = useState(45);
 const [daysOfWeek, setDaysOfWeek] = useState<Set<number>>(new Set([1, 2, 3, 4, 5])); // Mon-Fri
 
 // Notifications
 const [notifyViaApp, setNotifyViaApp] = useState(true);
 const [notifyViaSms, setNotifyViaSms] = useState(false);
 const [notifyViaEmail, setNotifyViaEmail] = useState(true);
 
 // Exceptions
 const [exceptions, setExceptions] = useState<Array<{
  date: string;
  type: 'vacation' | 'sick' | 'leave' | 'training' | 'other';
  reason?: string;
 }>>([]);
 
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

 // Calculate hours per day
 const dailyHours = useMemo(() => {
  if (!workStartTime || !workEndTime) return 0;
  const [sh, sm] = workStartTime.split(':').map(Number);
  const [eh, em] = workEndTime.split(':').map(Number);
  let hours = (eh + em / 60) - (sh + sm / 60);
  if (hours <= 0) hours += 24; // Handle overnight
  return Math.max(0, hours - breakMinutes / 60);
 }, [workStartTime, workEndTime, breakMinutes]);

 // Calculate total scheduled hours for pattern
 const patternSummary = useMemo(() => {
  if (patternType === 'single' || !patternStartDate || !patternEndDate) {
   return { daysPerWeek: 0, hoursPerWeek: 0, totalHours: 0, totalDays: 0 };
  }
  
  const start = new Date(patternStartDate);
  const end = new Date(patternEndDate);
  const dayCount = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Count working days in range
  let workingDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
   // ISO weekday: Mon=1, Sun=7
   const isoDay = d.getDay() === 0 ? 7 : d.getDay();
   if (daysOfWeek.has(isoDay)) {
    workingDays++;
   }
  }
  
  // Subtract exceptions
  const exceptionDays = exceptions.filter(e => {
   const exDate = new Date(e.date);
   return exDate >= start && exDate <= end;
  }).length;
  
  workingDays = Math.max(0, workingDays - exceptionDays);
  
  return {
   daysPerWeek: daysOfWeek.size,
   hoursPerWeek: daysOfWeek.size * dailyHours,
   totalHours: workingDays * dailyHours,
   totalDays: workingDays,
  };
 }, [patternType, patternStartDate, patternEndDate, daysOfWeek, dailyHours, exceptions]);

 // Toggle day of week
 const toggleDay = (day: number) => {
  setDaysOfWeek(prev => {
   const next = new Set(prev);
   if (next.has(day)) {
    next.delete(day);
   } else {
    next.add(day);
   }
   return next;
  });
 };

 // Add exception
 const addException = () => {
  setExceptions([...exceptions, { date: '', type: 'vacation' }]);
 };

 // Remove exception
 const removeException = (index: number) => {
  setExceptions(exceptions.filter((_, i) => i !== index));
 };

 // Update exception
 const updateException = (index: number, field: string, value: any) => {
  const updated = [...exceptions];
  updated[index] = { ...updated[index], [field]: value };
  setExceptions(updated);
 };

 const DAY_NAMES = [
  { num: 1, short: 'Mån', full: 'Måndag' },
  { num: 2, short: 'Tis', full: 'Tisdag' },
  { num: 3, short: 'Ons', full: 'Onsdag' },
  { num: 4, short: 'Tor', full: 'Torsdag' },
  { num: 5, short: 'Fre', full: 'Fredag' },
  { num: 6, short: 'Lör', full: 'Lördag' },
  { num: 7, short: 'Sön', full: 'Söndag' },
 ];

 const EXCEPTION_TYPES = [
  { value: 'vacation', label: 'Semester' },
  { value: 'sick', label: 'Sjukdom' },
  { value: 'leave', label: 'Ledighet' },
  { value: 'training', label: 'Utbildning' },
  { value: 'other', label: 'Annat' },
 ];

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
         employees.map((emp: any) => (
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

      {/* Pattern Type Selection */}
      {!schedule && (
       <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
         Typ av pass
        </label>
        <div className="flex gap-2">
         {[
          { value: 'single', label: 'Engångs' },
          { value: 'weekly', label: 'Veckopass' },
          { value: 'recurring', label: 'Återkommande' },
         ].map((type) => (
          <button
           key={type.value}
           type="button"
           onClick={() => setPatternType(type.value as PatternType)}
           className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            patternType === type.value
             ? 'bg-blue-500 text-white'
             : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
           }`}
          >
           {type.label}
          </button>
         ))}
        </div>
       </div>
      )}

      {/* Weekly/Recurring Pattern Options */}
      {!schedule && patternType !== 'single' && (
       <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
         <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
           Startdatum
          </label>
          <input
           type="date"
           value={patternStartDate}
           onChange={(e) => setPatternStartDate(e.target.value)}
           className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
           required
          />
         </div>
         <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
           Slutdatum
          </label>
          <input
           type="date"
           value={patternEndDate}
           onChange={(e) => setPatternEndDate(e.target.value)}
           className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
         </div>
        </div>

        {/* Work Times */}
        <div className="grid grid-cols-2 gap-3">
         <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
           Arbetstid från
          </label>
          <input
           type="time"
           value={workStartTime}
           onChange={(e) => setWorkStartTime(e.target.value)}
           className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
         </div>
         <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
           Arbetstid till
          </label>
          <input
           type="time"
           value={workEndTime}
           onChange={(e) => setWorkEndTime(e.target.value)}
           className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          />
         </div>
        </div>

        {/* Break Time */}
        <div>
         <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Paustid (avdrag)
         </label>
         <div className="flex gap-2">
          {[30, 45, 60].map((mins) => (
           <button
            key={mins}
            type="button"
            onClick={() => setBreakMinutes(mins)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
             breakMinutes === mins
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
            }`}
           >
            {mins} min
           </button>
          ))}
         </div>
        </div>

        {/* Days of Week */}
        <div>
         <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
          Arbetsdagar
         </label>
         <div className="flex gap-1">
          {DAY_NAMES.map((day) => (
           <button
            key={day.num}
            type="button"
            onClick={() => toggleDay(day.num)}
            className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${
             daysOfWeek.has(day.num)
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
            }`}
            title={day.full}
           >
            {day.short}
           </button>
          ))}
         </div>
        </div>

        {/* Summary */}
        {patternSummary.totalDays > 0 && (
         <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
          <div className="flex justify-between text-green-800 dark:text-green-300">
           <span>{patternSummary.daysPerWeek} dagar/vecka × {dailyHours.toFixed(1)}h</span>
           <span className="font-semibold">{patternSummary.hoursPerWeek.toFixed(1)}h/vecka</span>
          </div>
          <div className="flex justify-between text-green-700 dark:text-green-400 mt-1 font-medium">
           <span>Totalt för perioden:</span>
           <span>{patternSummary.totalHours.toFixed(1)}h ({patternSummary.totalDays} dagar)</span>
          </div>
         </div>
        )}

        {/* Exceptions */}
        <div>
         <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
           <AlertTriangle className="w-3 h-3" />
           Undantag/Frånvaro
          </label>
          <button
           type="button"
           onClick={addException}
           className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
           <Plus className="w-3 h-3" />
           Lägg till
          </button>
         </div>
         {exceptions.length > 0 && (
          <div className="space-y-2">
           {exceptions.map((exc, idx) => (
            <div key={idx} className="flex gap-2 items-center">
             <input
              type="date"
              value={exc.date}
              onChange={(e) => updateException(idx, 'date', e.target.value)}
              className="flex-1 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
             />
             <select
              value={exc.type}
              onChange={(e) => updateException(idx, 'type', e.target.value)}
              className="px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs"
             >
              {EXCEPTION_TYPES.map((t) => (
               <option key={t.value} value={t.value}>{t.label}</option>
              ))}
             </select>
             <button
              type="button"
              onClick={() => removeException(idx)}
              className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
             >
              <Trash2 className="w-3 h-3" />
             </button>
            </div>
           ))}
          </div>
         )}
        </div>

        {/* Notifications */}
        <div>
         <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
          <Bell className="w-3 h-3" />
          Notifieringar
         </label>
         <div className="flex gap-3 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer">
           <input
            type="checkbox"
            checked={notifyViaApp}
            onChange={(e) => setNotifyViaApp(e.target.checked)}
            className="rounded text-blue-500 text-xs"
           />
           <span className="text-xs text-gray-700 dark:text-gray-300">App</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
           <input
            type="checkbox"
            checked={notifyViaSms}
            onChange={(e) => setNotifyViaSms(e.target.checked)}
            className="rounded text-blue-500 text-xs"
           />
           <span className="text-xs text-gray-700 dark:text-gray-300">SMS</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
           <input
            type="checkbox"
            checked={notifyViaEmail}
            onChange={(e) => setNotifyViaEmail(e.target.checked)}
            className="rounded text-blue-500 text-xs"
           />
           <span className="text-xs text-gray-700 dark:text-gray-300">E-post</span>
          </label>
         </div>
        </div>
       </div>
      )}

      {/* Checkbox för flera projekt (only for single shifts) */}
      {!schedule && patternType === 'single' && (
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
