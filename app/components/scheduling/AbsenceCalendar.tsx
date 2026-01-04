// app/components/scheduling/AbsenceCalendar.tsx
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Absence } from '@/types/scheduling';
import { useAbsences } from '@/hooks/useAbsences';
import { AbsenceModal } from './AbsenceModal';

// Färgmappning för frånvaro
const absenceColors: Record<Absence['type'], string> = {
 vacation: 'bg-green-500 border-green-700',
 sick: 'bg-red-500 border-red-700',
 other: 'bg-gray-500 border-gray-700',
};

// Hjälpfunktioner för datum
const getYYYYMMDD = (date: Date): string => date.toISOString().split('T')[0];

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

export function AbsenceCalendar() {
 const [currentDate, setCurrentDate] = useState(new Date());
 
 // Börja från måndag i veckan
 const weekDays = useMemo(() => {
  const monday = new Date(currentDate);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  return getWeekDays(monday);
 }, [currentDate]);

 // Filter för hooks - använd useMemo för att undvika onödiga re-renders
 const filters = useMemo(() => {
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
   };
  }
  
  return {
   start_date: weekDays[0].dateString,
   end_date: weekDays[6].dateString,
  };
 }, [weekDays]);
 
 const { data: absences, isLoading } = useAbsences(filters);
 
 // Modal state
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);

 // Gruppera frånvaro per dag
 const absencesByDay = useMemo(() => {
  const map = new Map<string, Absence[]>();
  weekDays.forEach(day => map.set(day.dateString, []));
  
  absences?.forEach(absence => {
   // Hantera frånvaro som sträcker sig över flera dagar
   const startDate = new Date(absence.start_date);
   const endDate = new Date(absence.end_date);
   
   for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateString = getYYYYMMDD(d);
    if (map.has(dateString)) {
     map.get(dateString)!.push(absence);
    }
   }
  });
  return map;
 }, [absences, weekDays]);

 const handleOpenModalForEdit = (absence: Absence) => {
  setEditingAbsence(absence);
  setIsModalOpen(true);
 };
 
 const handleOpenModalForCreate = () => {
  setEditingAbsence(null);
  setIsModalOpen(true);
 };

 // Navigation
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

 return (
  <div className="w-full">
   {/* Header - Mobile optimized */}
   <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-sm mb-4">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
     <div className="flex items-center space-x-2 w-full sm:w-auto">
      <button 
       type="button" 
       onClick={goToPreviousWeek}
       className="p-2 min-w-[44px] min-h-[44px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
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
       className="p-2 min-w-[44px] min-h-[44px] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-manipulation"
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
      className="w-full sm:w-auto px-4 py-2 min-h-[44px] text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 touch-manipulation active:scale-95 transition-transform"
     >
      Registrera frånvaro
     </button>
    </div>
   </div>
   
   {isLoading && <p className="dark:text-white p-4">Laddar frånvaro...</p>}
   
   <div className="grid grid-cols-1 md:grid-cols-7 gap-2 sm:gap-3 p-2 sm:p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-x-auto">
    {weekDays.map((day) => {
     const dayAbsences = absencesByDay.get(day.dateString) || [];
     return (
      <div
       key={day.dateString}
       className="p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[200px] sm:min-h-[250px]"
      >
       <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-gray-200 border-b dark:border-gray-700 pb-2 sticky top-0 bg-gray-50 dark:bg-gray-800 z-10">
        {day.label}
       </h3>
       <div className="space-y-1.5 sm:space-y-2">
        {dayAbsences.length === 0 ? (
         <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          Ingen frånvaro
         </div>
        ) : (
         dayAbsences.map(absence => (
          <button
           key={absence.id}
           onClick={() => handleOpenModalForEdit(absence)}
           className={`w-full p-2.5 sm:p-2 min-h-[44px] rounded text-white text-xs sm:text-sm font-medium border-l-4 ${absenceColors[absence.type]} ${absence.status === 'pending' ? 'opacity-60' : ''} touch-manipulation active:scale-[0.98] transition-transform`}
          >
           {absence.type === 'vacation' ? 'Semester' : 
            absence.type === 'sick' ? 'Sjuk' : 'Övrig'}
           {absence.status === 'pending' && ' (Väntande)'}
          </button>
         ))
        )}
       </div>
      </div>
     );
    })}
   </div>
   
   <AbsenceModal
    isOpen={isModalOpen}
    onClose={() => setIsModalOpen(false)}
    absence={editingAbsence}
   />
  </div>
 );
}

