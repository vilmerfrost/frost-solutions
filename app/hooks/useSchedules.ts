// app/hooks/useSchedules.ts
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { useTenant } from '@/context/TenantContext';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { ScheduleSlot, CreateScheduleRequest, UpdateScheduleRequest, ScheduleFilters, ConflictCheckResponse } from '@/types/scheduling';

// Helper type for optimistic updates
type OptimisticUpdateContext = {
 previousSchedules?: ScheduleSlot[];
};

// Query key helper
const getScheduleQueryKey = (tenantId: string | null, filters: ScheduleFilters) => 
 ['schedules', tenantId, filters];

/**
 * Hook för att hämta schemapass baserat på filter
 * NOTE: Employee och project names enrichas i komponenterna med useEmployees() och useProjects()
 */
export const useSchedules = (filters: ScheduleFilters) => {
 const { tenantId } = useTenant();
 const queryKey = getScheduleQueryKey(tenantId, filters);

 return useQuery<ScheduleSlot[]>({
  queryKey: queryKey,
  queryFn: async () => {
   if (!tenantId) throw new Error('Tenant ID saknas');
   if (!filters.start_date || !filters.end_date) {
    throw new Error('start_date och end_date krävs');
   }

   const params = new URLSearchParams();
   if (filters.employee_id) params.append('employee_id', filters.employee_id);
   if (filters.project_id) params.append('project_id', filters.project_id);
   if (filters.status) params.append('status', filters.status);
   params.append('start_date', filters.start_date);
   params.append('end_date', filters.end_date);

   const schedules = await apiFetch<ScheduleSlot[]>(`/api/schedules?${params.toString()}`, {
    cache: 'no-store',
   });
   
   // Return schedules as-is - enrichment happens in components using useEmployees() and useProjects()
   return schedules || [];
  },
  enabled: !!tenantId && !!filters.start_date && !!filters.end_date,
 });
};

/**
 * Hook för att skapa ett nytt schemapass
 */
export const useCreateSchedule = (filters: ScheduleFilters) => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();
 const queryKey = getScheduleQueryKey(tenantId, filters);

 return useMutation<ScheduleSlot, Error, CreateScheduleRequest>({
  mutationFn: async (newSchedule) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   return apiFetch<ScheduleSlot>('/api/schedules', {
    method: 'POST',
    body: JSON.stringify(newSchedule),
   });
  },
  onSuccess: () => {
   toast.success('Schema sparat');
   queryClient.invalidateQueries({ queryKey });
  },
  onError: (error) => {
   toast.error(`Kunde inte spara: ${extractErrorMessage(error)}`);
  },
 });
};

/**
 * Hook för att uppdatera ett schemapass (med optimistisk uppdatering)
 */
export const useUpdateSchedule = (filters: ScheduleFilters) => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();
 const queryKey = getScheduleQueryKey(tenantId, filters);

 return useMutation<
  ScheduleSlot, 
  Error, 
  UpdateScheduleRequest & { id: string }, 
  OptimisticUpdateContext
 >({
  mutationFn: async (updatedSchedule) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   return apiFetch<ScheduleSlot>(`/api/schedules/${updatedSchedule.id}`, {
    method: 'PUT',
    body: JSON.stringify(updatedSchedule),
   });
  },
  onMutate: async (updatedSchedule) => {
   await queryClient.cancelQueries({ queryKey });
   const previousSchedules = queryClient.getQueryData<ScheduleSlot[]>(queryKey);

   queryClient.setQueryData<ScheduleSlot[]>(queryKey, (oldData) =>
    oldData?.map((slot) =>
     slot.id === updatedSchedule.id ? { ...slot, ...updatedSchedule } : slot
    ) || []
   );

   return { previousSchedules };
  },
  onError: (err, variables, context) => {
   toast.error(`Fel vid uppdatering: ${extractErrorMessage(err)}`);
   if (context?.previousSchedules) {
    queryClient.setQueryData(queryKey, context.previousSchedules);
   }
  },
  onSuccess: () => {
   toast.success('Schema uppdaterat');
  },
  onSettled: () => {
   queryClient.invalidateQueries({ queryKey });
  },
 });
};

/**
 * Hook för att ta bort ett schemapass (med optimistisk uppdatering)
 */
export const useDeleteSchedule = (filters: ScheduleFilters) => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();
 const queryKey = getScheduleQueryKey(tenantId, filters);

 return useMutation<void, Error, string, OptimisticUpdateContext>({
  mutationFn: async (scheduleId) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   await apiFetch(`/api/schedules/${scheduleId}`, { method: 'DELETE' });
  },
  onMutate: async (scheduleId) => {
   await queryClient.cancelQueries({ queryKey });
   const previousSchedules = queryClient.getQueryData<ScheduleSlot[]>(queryKey);

   queryClient.setQueryData<ScheduleSlot[]>(queryKey, (oldData) =>
    (oldData || []).filter((slot) => slot.id !== scheduleId)
   );

   return { previousSchedules };
  },
  onSuccess: () => {
   toast.success('Schema borttaget');
  },
  onError: (err, variables, context) => {
   toast.error(`Kunde inte ta bort: ${extractErrorMessage(err)}`);
   if (context?.previousSchedules) {
    queryClient.setQueryData(queryKey, context.previousSchedules);
   }
  },
  onSettled: () => {
   queryClient.invalidateQueries({ queryKey });
  },
 });
};

/**
 * Hook för att markera ett pass som slutfört (triggar backend-logik)
 */
export const useCompleteSchedule = (filters: ScheduleFilters) => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();
 const scheduleQueryKey = getScheduleQueryKey(tenantId, filters);

 return useMutation<{ schedule: ScheduleSlot; timeEntry: any }, Error, string>({
  mutationFn: async (scheduleId) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   return apiFetch<{ schedule: ScheduleSlot; timeEntry: unknown }>(`/api/schedules/${scheduleId}/complete`, {
    method: 'POST',
   });
  },
  onSuccess: () => {
   toast.success('Pass slutfört och tid rapporterad');
   queryClient.invalidateQueries({ queryKey: scheduleQueryKey });
   queryClient.invalidateQueries({ queryKey: ['time-entries'] });
  },
  onError: (err) => {
   toast.error(`Kunde inte slutföra: ${extractErrorMessage(err)}`);
  },
 });
};

/**
 * Hook för att kontrollera konflikter i realtid (vid D&D)
 * Backend endpoint är GET med query params
 */
export const useScheduleConflicts = () => {
 const { tenantId } = useTenant();

 return useMutation<
  ConflictCheckResponse,
  Error,
  { start_time: string; end_time: string; employee_id: string; exclude_id?: string }
 >({
  mutationFn: async (checkData) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const params = new URLSearchParams({
    employee_id: checkData.employee_id,
    start_time: checkData.start_time,
    end_time: checkData.end_time,
   });
   if (checkData.exclude_id) {
    params.append('exclude_id', checkData.exclude_id);
   }

   return apiFetch<ConflictCheckResponse>(`/api/schedules/conflicts?${params.toString()}`);
  },
  // No automatic toasts - called in real-time during drag
 });
};

