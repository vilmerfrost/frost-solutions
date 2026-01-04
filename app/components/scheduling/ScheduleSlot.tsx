// app/components/scheduling/ScheduleSlot.tsx
"use client";

import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ScheduleSlot as ScheduleSlotType } from '@/types/scheduling';
import { Clock, User, Briefcase, AlertTriangle } from 'lucide-react';

// Färgmappning enligt designsystem och spec
const statusColors: Record<ScheduleSlotType['status'], { border: string; bg: string; text: string; }> = {
 scheduled: {
  border: 'border-amber-500',
  bg: 'bg-amber-100',
  text: 'text-amber-800',
 },
 confirmed: {
  border: 'border-blue-600',
  bg: 'bg-blue-100',
  text: 'text-blue-800',
 },
 completed: {
  border: 'border-green-600',
  bg: 'bg-green-100',
  text: 'text-green-800',
 },
 cancelled: {
  border: 'border-gray-400',
  bg: 'bg-gray-100',
  text: 'text-gray-800',
 },
};

interface ScheduleSlotProps {
 schedule: ScheduleSlotType;
 employeeName: string;
 projectName: string;
 isDragging?: boolean; // Tillhandahålls av DragOverlay
 isConflict?: boolean; // Realtidskonflikt från D&D
 onClick: () => void; // För att öppna redigeringsmodal
}

export function ScheduleSlot({
 schedule,
 employeeName,
 projectName,
 isDragging,
 isConflict,
 onClick,
}: ScheduleSlotProps) {
 const {
  attributes,
  listeners,
  setNodeRef,
  transform,
  transition,
 } = useSortable({ id: schedule.id });

 const style = {
  transform: CSS.Transform.toString(transform),
  transition,
  opacity: isDragging ? 0.8 : 1,
 };

 const hasConflict = schedule.has_conflict || isConflict;
 const colors = statusColors[schedule.status] || statusColors.cancelled;
 
 // Använd Error-färg (Red) om konflikt, annars statusfärg
 const finalBorderColor = hasConflict ? 'border-red-500' : colors.border;

 const formatTime = (date: string) => new Date(date).toLocaleTimeString('sv-SE', {
  hour: '2-digit',
  minute: '2-digit',
 });

 // Förhindra att onClick triggas när man drar
 const [wasDragged, setWasDragged] = useState(false);
 
 const handlePointerDown = () => {
  setWasDragged(false);
 };
 
 const handlePointerMove = () => {
  setWasDragged(true);
 };
 
 const handleClick = (e: React.MouseEvent) => {
  // Förhindra click om användaren faktiskt har dragit
  if (wasDragged) {
   e.preventDefault();
   e.stopPropagation();
   setWasDragged(false);
   return;
  }
  onClick();
 };

 return (
  <div
   ref={setNodeRef}
   style={style}
   {...attributes}
   {...listeners}
   onPointerDown={handlePointerDown}
   onPointerMove={handlePointerMove}
   className={`relative flex flex-col justify-between p-2.5 sm:p-2 space-y-1 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 border-l-4 ${finalBorderColor} cursor-grab active:cursor-grabbing touch-none min-h-[44px] touch-manipulation active:scale-[0.98] transition-transform`}
   aria-label={`Schemapass för ${employeeName} på ${projectName}, ${formatTime(schedule.start_time)} till ${formatTime(schedule.end_time)}`}
   role="button"
   tabIndex={0}
   onClick={handleClick}
  >
   <div className="flex items-center space-x-2">
    <User className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
    <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
     {employeeName}
    </span>
   </div>
   <div className="flex items-center space-x-2">
    <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
     {projectName}
    </span>
   </div>
   <div className="flex items-center space-x-2 pt-1">
    <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
    <span className="text-sm text-gray-500 dark:text-gray-400">
     {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
    </span>
   </div>

   {/* Konfliktindikator */}
   {hasConflict && (
    <div 
     className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full shadow"
     title="Konflikt upptäckt"
    >
     <AlertTriangle className="w-4 h-4 text-white" />
    </div>
   )}
  </div>
 );
}

