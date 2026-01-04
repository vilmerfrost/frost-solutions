// app/components/scheduling/ScheduleCalendar.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import {
 DndContext,
 DragEndEvent,
 DragOverEvent,
 DragStartEvent,
 DragOverlay,
 PointerSensor,
 TouchSensor,
 useSensor,
 useSensors,
 closestCenter,
 useDroppable,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Våra komponenter
import { ScheduleSlot } from './ScheduleSlot';
import { ScheduleModal } from './ScheduleModal';

// Våra hooks
import { 
 useSchedules, 
 useUpdateSchedule, 
 useScheduleConflicts,
 useCreateSchedule 
} from '@/hooks/useSchedules';
import { useAbsences } from '@/hooks/useAbsences';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useAdmin } from '@/hooks/useAdmin';
import { useScheduleReminders } from '@/hooks/useScheduleReminders';

// Våra typer
import type { ScheduleSlot as ScheduleSlotType, ScheduleFilters } from '@/types/scheduling';
import type { Employee } from '@/types/supabase';
import type { Project } from '@/types/supabase';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';

// Hjälptyp för berikad data
type EnrichedScheduleSlot = ScheduleSlotType & {
 employeeName: string;
 projectName: string;
};

interface ScheduleCalendarProps {
 projectId?: string; // Optional: filter by project
 employeeId?: string; // Optional: filter by employee
}

const defaultProps: ScheduleCalendarProps = {};

// Hjälpfunktion för att få YYYY-MM-DD-format
const getYYYYMMDD = (date: Date): string => {
 return date.toISOString().split('T')[0];
};

// Hjälpfunktion för att skapa dag-kolumner
const getWeekDays = (startDate: Date): { date: Date; dateString: string; label: string }[] => {
 const days = [];
 for (let i = 0; i < 7; i++) {
  const day = new Date(startDate);
  day.setDate(startDate.getDate() + i);
  days.push({
   date: day,
   dateString: getYYYYMMDD(day),
   label: day.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'numeric' }),
  });
 }
 return days;
};

// Vår kalender-kolumn
interface CalendarColumnProps {
 date: Date;
 dateString: string;
 label: string;
 schedules: EnrichedScheduleSlot[];
 onSlotClick: (schedule: ScheduleSlotType) => void;
 onColumnClick: (dateString: string, date: Date) => void; // Nya callback för kolumn-klick
 isAdmin: boolean; // Admin status for enabling/disabling column click
}

function CalendarColumn({ date, dateString, label, schedules, onSlotClick, onColumnClick, isAdmin }: CalendarColumnProps) {
 const { setNodeRef, isOver } = useDroppable({
  id: dateString,
 });

 return (
  // Varje kolumn är en "Droppable" zon (med ID = datumsträng)
  <div
   ref={setNodeRef}
   className={`p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[300px] sm:min-h-[400px] ${isOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
  >
   <h3 
    className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-2 -mx-2 py-1 rounded transition-colors"
    onClick={() => isAdmin && onColumnClick(dateString, date)}
    title={isAdmin ? "Klicka för att skapa pass denna dag" : ""}
    style={{ cursor: isAdmin ? 'pointer' : 'default' }}
   >
    {label}
   </h3>
   
   {/* Gör hela kolumnen sortable */}
   <SortableContext
    items={schedules.map(s => s.id)}
    strategy={verticalListSortingStrategy}
   >
    <div className="space-y-2">
     {schedules.length === 0 ? (
      <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 text-center py-4">
       Inga pass
      </div>
     ) : (
      schedules.map(schedule => (
       <ScheduleSlot 
        key={schedule.id} 
        schedule={schedule}
        employeeName={schedule.employeeName}
        projectName={schedule.projectName}
        onClick={() => onSlotClick(schedule)}
       />
      ))
     )}
    </div>
   </SortableContext>
  </div>
 );
}

export function ScheduleCalendar({ projectId, employeeId }: ScheduleCalendarProps = defaultProps) {
 const [currentDate, setCurrentDate] = useState(new Date());
 
 // Hämta veckodagarna
 const weekDays = useMemo(() => {
  // Börja från måndag i veckan
  const monday = new Date(currentDate);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  monday.setDate(diff);
  return getWeekDays(monday);
 }, [currentDate]);

 // Filter state - Måste vara YYYY-MM-DD
 // Beräkna filters från weekDays för att undvika race conditions
 const filters = useMemo<ScheduleFilters>(() => {
  if (weekDays.length === 0) {
   // Fallback om weekDays inte är beräknat ännu
   const today = new Date();
   const monday = new Date(today);
   const day = monday.getDay();
   const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
   monday.setDate(diff);
   const endDate = new Date(monday);
   endDate.setDate(endDate.getDate() + 6);
   
   return {
    start_date: getYYYYMMDD(monday),
    end_date: getYYYYMMDD(endDate),
    ...(projectId && { project_id: projectId }),
    ...(employeeId && { employee_id: employeeId }),
   };
  }
  
  return {
   start_date: weekDays[0].dateString,
   end_date: weekDays[6].dateString,
   ...(projectId && { project_id: projectId }),
   ...(employeeId && { employee_id: employeeId }),
  };
 }, [weekDays, projectId, employeeId]);

 // Datahämtning
 const { data: schedules, isLoading: isLoadingSchedules } = useSchedules(filters);
 const { data: employees, isLoading: isLoadingEmployees, error: employeesError } = useEmployees();
 const { data: projects, isLoading: isLoadingProjects } = useProjects();
 const { data: absences } = useAbsences({
  start_date: filters.start_date,
  end_date: filters.end_date,
 });
 const { isAdmin } = useAdmin(); // Check if user is admin
 
 // Schedule reminders for non-admin employees
 useScheduleReminders();

 // Local loading state for async operations
 const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

 // Mutation hooks
 const updateSchedule = useUpdateSchedule(filters);
 const createSchedule = useCreateSchedule(filters);
 const checkConflicts = useScheduleConflicts();

 // D&D State
 const [activeId, setActiveId] = useState<string | null>(null);
 const [currentConflict, setCurrentConflict] = useState<boolean>(false);
 
 // Modal State
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingSchedule, setEditingSchedule] = useState<ScheduleSlotType | null>(null);
 const [defaultModalData, setDefaultModalData] = useState<{startTime: string, employeeId?: string} | undefined>();

 // D&D-sensorer (Mobile-first med 250ms delay)
 const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(TouchSensor, {
   activationConstraint: {
    delay: 250,
    tolerance: 5,
   },
  })
 );

 // BERIKNING AV DATA (som krävt)
 const enrichedSchedules = useMemo((): EnrichedScheduleSlot[] => {
  if (!schedules || !employees || !projects) return [];
  
  // Skapa uppslagstabeller för prestanda
  const employeeMap = new Map<string, Employee>(employees.map(e => [e.id, e]));
  const projectMap = new Map<string, Project>(projects.map(p => [p.id, p]));

  return schedules.map(schedule => ({
   ...schedule,
   employeeName: employeeMap.get(schedule.employee_id)?.full_name || 'Okänd',
   projectName: projectMap.get(schedule.project_id)?.name || 'Okänt projekt',
  }));
 }, [schedules, employees, projects]);

 // Gruppera berikade scheman per dag
 const schedulesByDay = useMemo(() => {
  const map = new Map<string, EnrichedScheduleSlot[]>();
  weekDays.forEach(day => map.set(day.dateString, []));
  
  enrichedSchedules.forEach(schedule => {
   const scheduleDate = getYYYYMMDD(new Date(schedule.start_time));
   if (map.has(scheduleDate)) {
    map.get(scheduleDate)!.push(schedule);
   }
  });
  return map;
 }, [enrichedSchedules, weekDays]);

 const activeSchedule = activeId ? enrichedSchedules.find(s => s.id === activeId) : null;

 // D&D-hanterare
 const handleDragStart = (event: DragStartEvent) => {
  setActiveId(event.active.id as string);
  setCurrentConflict(false);
 };

 // Debounce för att undvika för många API-anrop
 const conflictCheckTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

 const handleDragOver = async (event: DragOverEvent) => {
  const { active, over } = event;
  if (!over || !activeSchedule) {
   setCurrentConflict(false);
   return;
  }

  // Rensa tidigare timeout
  if (conflictCheckTimeoutRef.current) {
   clearTimeout(conflictCheckTimeoutRef.current);
  }

  // `over.id` är datumsträngen (YYYY-MM-DD) för kolumnen
  const overDateString = over.id as string;
  
  // Om vi drar till en ny dag
  const originalDateString = getYYYYMMDD(new Date(activeSchedule.start_time));
  if (overDateString !== originalDateString) {
   // Debounce konfliktkontrollen för att undvika race conditions
   conflictCheckTimeoutRef.current = setTimeout(async () => {
    try {
     // Beräkna nya tider med korrekt tidszon (behåll lokal tid)
     const start = new Date(activeSchedule.start_time);
     const end = new Date(activeSchedule.end_time);
     const duration = end.getTime() - start.getTime();
     
     // Skapa ny startdatum med korrekt tidszon
     const newStartDate = new Date(overDateString + 'T' + start.toTimeString().slice(0, 5));
     
     const newEndDate = new Date(newStartDate.getTime() + duration);

     // KÖR KONFLIKTKOLL (som krävt)
     const result = await checkConflicts.mutateAsync({
      employee_id: activeSchedule.employee_id,
      start_time: newStartDate.toISOString(),
      end_time: newEndDate.toISOString(),
      exclude_id: activeSchedule.id
     });
     setCurrentConflict(result.hasConflict || false);
    } catch (error) {
     setCurrentConflict(true); // Anta konflikt vid fel
    }
   }, 100); // 100ms debounce
  } else {
   setCurrentConflict(false); // Ingen konflikt om vi är i samma kolumn
  }
 };

 const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  // Endast admins kan flytta scheman
  if (!isAdmin) {
   toast.error('Endast admins kan flytta scheman');
   setActiveId(null);
   setCurrentConflict(false);
   return;
  }

  if (active.id !== over?.id && over?.id && activeSchedule) {
   const overDateString = over.id as string;
   const originalDateString = getYYYYMMDD(new Date(activeSchedule.start_time));

   // Om vi har en realtidskonflikt, avbryt
   if (currentConflict) {
    toast.error('Kan inte flytta passet hit, det skapar en konflikt.');
   } 
   // Om vi byter dag (och ingen konflikt)
   else if (overDateString !== originalDateString) {
    // Beräkna nya tider med korrekt tidszon
    const start = new Date(activeSchedule.start_time);
    const end = new Date(activeSchedule.end_time);
    const duration = end.getTime() - start.getTime();
    
    // Skapa ny startdatum med korrekt tidszon (behåll lokal tid)
    const newStartDate = new Date(overDateString + 'T' + start.toTimeString().slice(0, 5));
    
    const newEndDate = new Date(newStartDate.getTime() + duration);

    // Anropa update-hook (med optimistisk uppdatering)
    updateSchedule.mutate({
     id: activeSchedule.id,
     start_time: newStartDate.toISOString(),
     end_time: newEndDate.toISOString(),
    });
    // Toast handled by hook
   }
  }
  setActiveId(null);
  setCurrentConflict(false);
  
  // Rensa timeout vid drag end
  if (conflictCheckTimeoutRef.current) {
   clearTimeout(conflictCheckTimeoutRef.current);
   conflictCheckTimeoutRef.current = null;
  }
 };
 
 // Modalhanterare
 const handleOpenModalForEdit = (schedule: ScheduleSlotType) => {
  setEditingSchedule(schedule);
  setDefaultModalData(undefined);
  setIsModalOpen(true);
 };
 
 const handleOpenModalForCreate = () => {
  setEditingSchedule(null);
  setDefaultModalData({ startTime: new Date().toISOString() });
  setIsModalOpen(true);
 };

 const handleOpenModalForDate = (dateString: string, date: Date) => {
  setEditingSchedule(null);
  // Sätt starttid till samma datum, kl 08:00
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const startTime = `${year}-${month}-${day}T08:00:00`;
  setDefaultModalData({ startTime });
  setIsModalOpen(true);
 };
 
 const handleCloseModal = () => {
  setIsModalOpen(false);
  setEditingSchedule(null);
  setDefaultModalData(undefined);
 };

 // Funktion för att skapa schema för hela veckan
 const handleCreateWeekSchedule = async () => {
  if (!employees || employees.length === 0 || !projects || projects.length === 0) {
   toast.error('Inga anställda eller projekt hittades');
   return;
  }

  // Öppna en modal för att välja anställd, projekt och shift_type
  const employeeId = prompt('Välj anställd (skriv nummer eller namn):\n' + 
   employees.map((e, i) => `${i + 1}. ${e.full_name || e.name || e.id}`).join('\n'));
  
  if (!employeeId) return;
  
  const selectedEmployee = employees.find((e, i) => 
   (i + 1).toString() === employeeId || 
   e.full_name?.toLowerCase().includes(employeeId.toLowerCase()) ||
   e.name?.toLowerCase().includes(employeeId.toLowerCase())
  );

  if (!selectedEmployee) {
   toast.error('Anställd hittades inte');
   return;
  }

  const projectId = prompt('Välj projekt (skriv nummer eller namn):\n' + 
   projects.map((p, i) => `${i + 1}. ${p.name}`).join('\n'));
  
  if (!projectId) return;
  
  const selectedProject = projects.find((p, i) => 
   (i + 1).toString() === projectId || 
   p.name.toLowerCase().includes(projectId.toLowerCase())
  );

  if (!selectedProject) {
   toast.error('Projekt hittades inte');
   return;
  }

  const shiftType = prompt('Typ av pass:\n1. Dagtid (08:00-16:00)\n2. Kväll (18:00-22:00)\n3. Natt (22:00-06:00)') || '1';
  const shiftTypeMap: Record<string, 'day' | 'evening' | 'night'> = {
   '1': 'day',
   '2': 'evening',
   '3': 'night',
  };
  const selectedShiftType = shiftTypeMap[shiftType] || 'day';

  // Skapa schema för varje dag i veckan
  setIsCreatingSchedule(true);
  try {
   const schedulesToCreate = weekDays.map(day => {
    const times = selectedShiftType === 'day' 
     ? { start: `${day.dateString}T08:00:00`, end: `${day.dateString}T16:00:00` }
     : selectedShiftType === 'evening'
     ? { start: `${day.dateString}T18:00:00`, end: `${day.dateString}T22:00:00` }
     : { start: `${day.dateString}T22:00:00`, end: `${day.dateString}T06:00:00` }; // Nästa dag för natt

    return {
     employee_id: selectedEmployee.id,
     project_id: selectedProject.id,
     start_time: new Date(times.start).toISOString(),
     end_time: selectedShiftType === 'night' 
      ? new Date(new Date(times.start).getTime() + 8 * 60 * 60 * 1000).toISOString()
      : new Date(times.end).toISOString(),
     status: 'scheduled' as const,
     shift_type: selectedShiftType,
    };
   });

   // Skapa alla scheman sekventiellt för att undvika konflikter
   for (const schedule of schedulesToCreate) {
    await createSchedule.mutateAsync(schedule);
   }

   toast.success(`Schema skapat för hela veckan för ${selectedEmployee.full_name || selectedEmployee.name}`);
  } catch (error) {
   toast.error(`Fel vid skapande av veckoschema: ${extractErrorMessage(error)}`);
  } finally {
   setIsCreatingSchedule(false);
  }
 };

 // Navigation buttons
 const goToPreviousWeek = () => {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() - 7);
  setCurrentDate(newDate);
 };

 const goToNextWeek = () => {
  const newDate = new Date(currentDate);
  newDate.setDate(newDate.getDate() + 7);
  setCurrentDate(newDate);
 };

 const goToToday = () => {
  setCurrentDate(new Date());
 };

 const isLoading = isLoadingSchedules || isLoadingEmployees || isLoadingProjects || isCreatingSchedule;

 return (
  <DndContext
   sensors={sensors}
   collisionDetection={closestCenter}
   onDragStart={handleDragStart}
   onDragOver={handleDragOver}
   onDragEnd={handleDragEnd}
  >
   {/* Header med navigation och filter - Mobile optimized */}
   <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm mb-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
     <div className="flex items-center space-x-2 w-full sm:w-auto">
      <button 
       type="button" 
       onClick={goToPreviousWeek}
       className="p-2 sm:p-2 min-w-[44px] min-h-[44px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
       aria-label="Föregående vecka"
      >
       ←
      </button>
      <button 
       type="button" 
       onClick={goToToday}
       className="px-4 py-2 min-h-[44px] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
      >
       Idag
      </button>
      <button 
       type="button" 
       onClick={goToNextWeek}
       className="p-2 sm:p-2 min-w-[44px] min-h-[44px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
       aria-label="Nästa vecka"
      >
       →
      </button>
      <span className="ml-2 sm:ml-4 text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
       {weekDays[0]?.dateString} - {weekDays[6]?.dateString}
      </span>
     </div>
     <button 
      type="button" 
      onClick={handleOpenModalForCreate}
      disabled={!isAdmin}
      className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 touch-manipulation active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
      title={!isAdmin ? 'Endast admins kan skapa scheman' : ''}
     >
      Skapa nytt pass
     </button>
     {isAdmin && (
      <button 
       type="button" 
       onClick={handleCreateWeekSchedule}
       disabled={isLoading}
       className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
      >
       Skapa för hela veckan
      </button>
     )}
    </div>
   </div>

   {isLoading && <p className="dark:text-white p-4">Laddar kalender...</p>}
   
   {/* Debug info för anställda */}
   {employeesError && (
    <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg mb-4">
     <p>Fel vid hämtning av anställda: {String(employeesError)}</p>
    </div>
   )}
   
   {!isLoadingEmployees && employees && employees.length === 0 && (
    <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 rounded-lg mb-4">
     <p>Inga anställda hittades. Kontrollera att du är inloggad som admin.</p>
    </div>
   )}
   
   {/* Calendar Grid (Mobile-first: 1 kolumn, Desktop: 7 kolumner) */}
   <div className="grid grid-cols-1 md:grid-cols-7 gap-2 sm:gap-3 p-2 sm:p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto">
    {weekDays.map((day) => (
     <CalendarColumn
      key={day.dateString}
      date={day.date}
      dateString={day.dateString}
      label={day.label}
      schedules={schedulesByDay.get(day.dateString) || []}
      onSlotClick={handleOpenModalForEdit}
      onColumnClick={handleOpenModalForDate}
      isAdmin={isAdmin}
     />
    ))}
   </div>

   {/* Drag Overlay: Visar komponenten som dras */}
   <DragOverlay>
    {activeSchedule ? (
     <ScheduleSlot 
      schedule={activeSchedule} 
      employeeName={activeSchedule.employeeName}
      projectName={activeSchedule.projectName}
      isDragging
      isConflict={currentConflict} 
      onClick={() => {}} // Klick inaktiverat under drag
     />
    ) : null}
   </DragOverlay>
   
   {/* Modal för att skapa/redigera */}
   <ScheduleModal
    isOpen={isModalOpen}
    onClose={handleCloseModal}
    schedule={editingSchedule}
    filters={filters}
    defaultStartTime={defaultModalData?.startTime}
    defaultEmployeeId={defaultModalData?.employeeId}
   />
  </DndContext>
 );
}

