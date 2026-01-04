// app/components/scheduling/ScheduleCard.tsx
"use client";

import React, { useMemo } from 'react';
import type { ScheduleSlot, ScheduleFilters } from '@/types/scheduling';
// Hooks
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useDeleteSchedule, useCompleteSchedule } from '@/hooks/useSchedules';
// Icons
import { Clock, User, Briefcase, AlertTriangle, CheckCircle, Pencil, Trash } from 'lucide-react';

// Färgmappning för status-badges
const badgeColors: Record<ScheduleSlot['status'], string> = {
 scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
 confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', 
 completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
 cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

interface ScheduleCardProps {
 schedule: ScheduleSlot;
 onEdit: (schedule: ScheduleSlot) => void;
 // Vi behöver filters för att kunna invalidera rätt query-nycklar
 queryFilters: ScheduleFilters; 
}

export function ScheduleCard({ schedule, onEdit, queryFilters }: ScheduleCardProps) {
 
 // Data-enrichment (som krävt för standalone-komponent)
 const { data: employees } = useEmployees();
 const { data: projects } = useProjects();
 
 const employeeName = useMemo(() => 
  employees?.find(e => e.id === schedule.employee_id)?.full_name || 'Laddar...'
 , [employees, schedule.employee_id]);
 
 const projectName = useMemo(() => 
  projects?.find(p => p.id === schedule.project_id)?.name || 'Laddar...'
 , [projects, schedule.project_id]);

 // Actions
 const deleteSchedule = useDeleteSchedule(queryFilters);
 const completeSchedule = useCompleteSchedule(queryFilters);
 
 const handleDelete = async () => {
  if (window.confirm('Är du säker på att du vill ta bort detta pass?')) {
   try {
    await deleteSchedule.mutateAsync(schedule.id);
    // Toast handled by hook
   } catch (error) {
    // Error toast handled by hook
   }
  }
 };
 
 const handleComplete = async () => {
  if (window.confirm('Vill du markera passet som slutfört? Tid kommer att rapporteras.')) {
   try {
    await completeSchedule.mutateAsync(schedule.id);
    // Toast handled by hook
   } catch (error) {
    // Error toast handled by hook
   }
  }
 };

 const formatTime = (date: string) => new Date(date).toLocaleTimeString('sv-SE', {
  hour: '2-digit',
  minute: '2-digit',
 });
 
 const formatDate = (date: string) => new Date(date).toLocaleDateString('sv-SE', {
  day: 'numeric',
  month: 'short',
 });

 return (
  <article 
   className="relative p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
   aria-labelledby={`schedule-card-${schedule.id}`}
  >
   <div className="flex justify-between items-start">
    <div>
     <h3 id={`schedule-card-${schedule.id}`} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      {projectName}
     </h3>
     <p className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <User className="w-4 h-4" />
      <span>{employeeName}</span>
     </p>
    </div>
    
    {/* Quick Actions Meny (Desktop) */}
    <div className="hidden md:flex space-x-1">
     <button 
      onClick={() => onEdit(schedule)}
      className="p-2 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      title="Redigera"
      aria-label="Redigera pass"
     >
      <Pencil className="w-4 h-4" />
     </button>
     <button 
      onClick={handleDelete}
      className="p-2 text-gray-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      title="Ta bort"
      aria-label="Ta bort pass"
     >
      <Trash className="w-4 h-4" />
     </button>
    </div>
   </div>
   
   <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
    <div className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
     <Clock className="w-4 h-4 text-gray-400" />
     <span>{formatDate(schedule.start_time)}</span>
     <span className="text-gray-400">|</span>
     <span>{formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}</span>
    </div>
    
    <span
     className={`px-3 py-1 text-xs font-medium rounded-full ${badgeColors[schedule.status]}`}
    >
     {schedule.status === 'scheduled' ? 'Schemalagd' : 
      schedule.status === 'confirmed' ? 'Bekräftad' :
      schedule.status === 'completed' ? 'Slutförd' : 'Avbokad'}
    </span>
   </div>
   
   {schedule.has_conflict && (
    <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md text-sm flex items-center space-x-2">
     <AlertTriangle className="w-5 h-5" />
     <span>Detta pass har en schemakonflikt.</span>
    </div>
   )}

   {/* Quick-action för "Complete" */}
   {schedule.status === 'confirmed' && (
    <div className="mt-4 border-t dark:border-gray-700 pt-3">
     <button 
      onClick={handleComplete}
      className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
     >
      <CheckCircle className="w-4 h-4" />
      <span>Markera som slutförd</span>
     </button>
    </div>
   )}
  </article>
 );
}

