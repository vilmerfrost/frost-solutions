// app/components/dashboard/WeeklySchedulesComponent.tsx
"use client";

import { useMemo } from 'react';
import { useTenant } from '@/context/TenantContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useSchedules } from '@/hooks/useSchedules';
import { useProjects } from '@/hooks/useProjects';
import { useEmployees } from '@/hooks/useEmployees';
import type { ScheduleSlot } from '@/types/scheduling';
import { Calendar, Clock, Briefcase, User } from 'lucide-react';

export function WeeklySchedules() {
  const { tenantId } = useTenant();
  const { isAdmin, employeeId } = useAdmin();

  // Hämta veckans scheman
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay();
  const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  const { data: schedules, isLoading } = useSchedules({
    start_date: startDate,
    end_date: endDate,
    ...(isAdmin ? {} : { employee_id: employeeId || '' }),
  });

  const { data: projects } = useProjects();
  const { data: employees } = useEmployees();

  // Gruppera scheman per dag
  const schedulesByDay = useMemo(() => {
    if (!schedules) return {};
    
    const grouped: Record<string, ScheduleSlot[]> = {};
    schedules.forEach(schedule => {
      const date = new Date(schedule.start_time).toISOString().split('T')[0];
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(schedule);
    });
    
    return grouped;
  }, [schedules]);

  // Hämta projektnamn och anställdnamn
  const getProjectName = (projectId: string) => {
    return projects?.find(p => p.id === projectId)?.name || 'Okänt projekt';
  };

  const getEmployeeName = (employeeId: string) => {
    return employees?.find(e => e.id === employeeId)?.full_name || employees?.find(e => e.id === employeeId)?.name || 'Okänd';
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const totalSchedules = schedules?.length || 0;
  const totalHours = schedules?.reduce((sum, s) => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return sum + hours;
  }, 0) || 0;

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Pass denna vecka</h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Laddar...</p>
      </div>
    );
  }

  if (totalSchedules === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Pass denna vecka</h2>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Inga schemalagda pass denna vecka</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm p-6 sm:p-8 border border-gray-200 dark:border-gray-700 mb-6 sm:mb-8">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-700 dark:text-gray-300">Pass denna vecka</h2>
          </div>
          <div className="text-right">
            <div className="text-xl sm:text-2xl font-semibold text-gray-700 dark:text-gray-300">{totalSchedules}</div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">pass</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Totalt timmar</span>
            </div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">{totalHours.toFixed(1)}h</div>
          </div>
          <div className="bg-white dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Projekt</span>
            </div>
            <div className="text-xl font-semibold text-gray-800 dark:text-gray-200">
              {new Set(schedules?.map(s => s.project_id)).size}
            </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {Object.entries(schedulesByDay)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, daySchedules]) => (
              <div key={date} className="bg-white dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatDate(date)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">({daySchedules.length} pass)</span>
                </div>
                <div className="space-y-2">
                  {daySchedules.map(schedule => (
                    <div key={schedule.id} className="bg-gray-50 dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                              {getProjectName(schedule.project_id)}
                            </span>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center gap-2 mb-1">
                              <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {getEmployeeName(schedule.employee_id)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                            </span>
                          </div>
                        </div>
                        <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs font-semibold text-blue-700 dark:text-blue-300">
                          {schedule.status === 'scheduled' ? 'Schemalagd' :
                           schedule.status === 'confirmed' ? 'Bekräftad' :
                           schedule.status === 'completed' ? 'Slutförd' : 'Avbokad'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

