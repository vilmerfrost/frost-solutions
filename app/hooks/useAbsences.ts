// app/hooks/useAbsences.ts
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { useTenant } from '@/context/TenantContext';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { Absence } from '@/types/scheduling';

interface AbsenceInput {
 employee_id: string;
 start_date: string; // YYYY-MM-DD
 end_date: string;  // YYYY-MM-DD
 type: 'vacation' | 'sick' | 'other';
 reason?: string;
}

interface UpdateAbsenceInput {
 start_date?: string;
 end_date?: string;
 type?: 'vacation' | 'sick' | 'other';
 status?: 'pending' | 'approved' | 'rejected';
 reason?: string;
}

interface AbsenceFilters {
 employee_id?: string;
 start_date?: string;
 end_date?: string;
 status?: 'pending' | 'approved' | 'rejected';
}

// Query key helper
const getAbsenceQueryKey = (tenantId: string | null, filters?: AbsenceFilters) => 
 ['absences', tenantId, filters];

/**
 * Hook för att hämta frånvaro
 */
export const useAbsences = (filters?: AbsenceFilters) => {
 const { tenantId } = useTenant();
 const queryKey = getAbsenceQueryKey(tenantId, filters);

 return useQuery<Absence[]>({
  queryKey: queryKey,
  queryFn: async () => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const params = new URLSearchParams();
   if (filters?.employee_id) params.append('employee_id', filters.employee_id);
   if (filters?.status) params.append('status', filters.status);
   if (filters?.start_date) params.append('start_date', filters.start_date);
   if (filters?.end_date) params.append('end_date', filters.end_date);

   return apiFetch<Absence[]>(`/api/absences?${params.toString()}`, {
    cache: 'no-store',
   });
  },
  enabled: !!tenantId,
 });
};

/**
 * Hook för att skapa ny frånvaro
 */
export const useCreateAbsence = () => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<Absence, Error, AbsenceInput>({
  mutationFn: async (newAbsence) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   return apiFetch<Absence>('/api/absences', {
    method: 'POST',
    body: JSON.stringify(newAbsence),
   });
  },
  onSuccess: () => {
   toast.success('Frånvaro sparad');
   queryClient.invalidateQueries({ queryKey: getAbsenceQueryKey(tenantId) });
  },
  onError: (error) => {
   toast.error(`Kunde inte spara: ${extractErrorMessage(error)}`);
  },
 });
};

/**
 * Hook för att uppdatera frånvaro
 */
export const useUpdateAbsence = () => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<Absence, Error, UpdateAbsenceInput & { id: string }>({
  mutationFn: async (updatedAbsence) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const { id, ...updateData } = updatedAbsence;

   return apiFetch<Absence>(`/api/absences/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
   });
  },
  onSuccess: () => {
   toast.success('Frånvaro uppdaterad');
   queryClient.invalidateQueries({ queryKey: getAbsenceQueryKey(tenantId) });
  },
  onError: (error) => {
   toast.error(`Kunde inte uppdatera: ${extractErrorMessage(error)}`);
  },
 });
};

/**
 * Hook för att ta bort frånvaro
 */
export const useDeleteAbsence = () => {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<void, Error, string>({
  mutationFn: async (absenceId) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   await apiFetch(`/api/absences/${absenceId}`, { method: 'DELETE' });
  },
  onSuccess: () => {
   toast.success('Frånvaro borttagen');
   queryClient.invalidateQueries({ queryKey: getAbsenceQueryKey(tenantId) });
  },
  onError: (error) => {
   toast.error(`Kunde inte ta bort: ${extractErrorMessage(error)}`);
  },
 });
};

