// app/hooks/useScheduleReminders.ts
"use client";

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from '@/lib/toast';
import type { ScheduleSlot } from '@/types/scheduling';

interface ScheduleReminder {
 schedule: ScheduleSlot;
 employeeName: string;
 projectName: string;
 minutesLate: number;
}

/**
 * Hook för att kolla om anställda är schemalagda men inte stämplat in
 * Visar påminnelse om de är sena
 */
export function useScheduleReminders() {
 const { tenantId } = useTenant();
 const { isAdmin, employeeId } = useAdmin();

 // Hämta dagens scheman
 const { data: schedules } = useQuery({
  queryKey: ['schedule-reminders', tenantId],
  queryFn: async () => {
   if (!tenantId) return [];

   const today = new Date();
   const startOfDay = new Date(today.setHours(0, 0, 0, 0));
   const endOfDay = new Date(today.setHours(23, 59, 59, 999));

   const response = await fetch(
    `/api/schedules?start_date=${startOfDay.toISOString().split('T')[0]}&end_date=${endOfDay.toISOString().split('T')[0]}`,
    { cache: 'no-store' }
   );

   if (!response.ok) return [];

   const schedulesData = await response.json() as ScheduleSlot[];
   return schedulesData.filter(s => s.status === 'scheduled' || s.status === 'confirmed');
  },
  enabled: !!tenantId,
  refetchInterval: 60000, // Kolla varje minut
 });

 // Hämta dagens time entries för att kolla om någon stämplat in
 const { data: timeEntries } = useQuery({
  queryKey: ['today-time-entries', tenantId],
  queryFn: async () => {
   if (!tenantId) return [];

   const today = new Date().toISOString().split('T')[0];
   const response = await fetch(`/api/time-entries/list?date=${today}`, { cache: 'no-store' });

   if (!response.ok) return [];

   const data = await response.json();
   return data.timeEntries || data.entries || data || [];
  },
  enabled: !!tenantId,
  refetchInterval: 60000, // Kolla varje minut
 });

 // Kolla för påminnelser
 useEffect(() => {
  if (!schedules || !timeEntries || !employeeId || isAdmin) {
   // Endast för anställda (inte admins) och när vi har data
   return;
  }

  const now = new Date();
  const reminders: ScheduleReminder[] = [];

  schedules.forEach(schedule => {
   // Endast kolla scheman för den aktuella användaren
   if (schedule.employee_id !== employeeId) return;

   const scheduleStart = new Date(schedule.start_time);
   const minutesLate = Math.floor((now.getTime() - scheduleStart.getTime()) / (1000 * 60));

   // Om schemat startat och användaren är minst 5 minuter sen
   if (minutesLate >= 5 && minutesLate <= 60) {
    // Kolla om användaren har stämplat in på detta projekt idag
    const hasTimeEntry = timeEntries.some((te: any) => 
     te.employee_id === employeeId &&
     te.project_id === schedule.project_id &&
     new Date(te.date).toISOString().split('T')[0] === now.toISOString().split('T')[0]
    );

    if (!hasTimeEntry) {
     reminders.push({
      schedule,
      employeeName: schedule.employee_name || 'Du',
      projectName: schedule.project_name || 'Projektet',
      minutesLate,
     });
    }
   }
  });

  // Visa påminnelse om det finns några
  if (reminders.length > 0) {
   reminders.forEach(reminder => {
    toast.warning(
     `⏰ Du är schemalagd på ${reminder.projectName} men har inte stämplat in. Är du sen? Vill du meddela handläggare?`,
     {
      duration: 10000,
      action: {
       label: 'Meddela',
       onClick: () => {
        // TODO: Öppna modal för att meddela handläggare
        window.location.href = '/reports/new';
       },
      },
     }
    );
   });
  }
 }, [schedules, timeEntries, employeeId, isAdmin]);

 return { reminders: [] };
}

