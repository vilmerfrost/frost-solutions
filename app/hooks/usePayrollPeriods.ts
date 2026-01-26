// app/hooks/usePayrollPeriods.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';
import { PayrollAPI } from '@/lib/api/payroll';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from 'sonner';
import type {
 PayrollPeriodFilters,
 CreatePayrollPeriodPayload,
} from '@/types/payroll';

/**
 * Hämta lista över löneperioder med filters
 */
export function usePayrollPeriods(filters?: PayrollPeriodFilters) {
 const { tenantId, isLoading: tenantLoading } = useTenant();

 return useQuery({
  queryKey: ['payroll-periods', tenantId, filters],
  queryFn: async () => {
   console.log('[usePayrollPeriods] Fetching periods...', { filters });
   const periods = await PayrollAPI.list(filters);
   console.log('[usePayrollPeriods] ✅ Periods fetched', { count: periods.length });
   return periods;
  },
  enabled: !!tenantId && !tenantLoading,
  staleTime: 1000 * 60 * 2, // 2 minuter
  retry: (failureCount, error: any) => {
   // Retry inte på 404 eller 401
   if (error?.message?.includes('404') || error?.message?.includes('401')) {
    return false;
   }
   return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
 });
}

/**
 * Hämta en specifik löneperiod
 */
export function usePayrollPeriod(id: string | null) {
 const { tenantId, isLoading: tenantLoading } = useTenant();

 return useQuery({
  queryKey: ['payroll-periods', id],
  queryFn: async () => {
   console.log('[usePayrollPeriod] Fetching period...', { periodId: id });
   const period = await PayrollAPI.get(id!);
   console.log('[usePayrollPeriod] ✅ Period fetched', {
    periodId: id,
    status: period.status,
   });
   return period;
  },
  enabled: !!id && !!tenantId && !tenantLoading,
  staleTime: 1000 * 60 * 2,
  retry: (failureCount, error: any) => {
   if (error?.message?.includes('404') || error?.message?.includes('401')) {
    return false;
   }
   return failureCount < 3;
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
 });
}

/**
 * Skapa ny löneperiod
 * Enhanced error handling baserat på GPT-4o approach
 */
export function useCreatePayrollPeriod() {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (payload: CreatePayrollPeriodPayload) => {
   console.log('[useCreatePayrollPeriod] 🚀 Mutation starting');
   console.log('[useCreatePayrollPeriod] Payload:', payload);
   
   const result = await apiFetch<{ success?: boolean; data?: unknown; error?: string; details?: unknown }>(
    '/api/payroll/periods',
    {
     method: 'POST',
     credentials: 'include',
     body: JSON.stringify(payload),
    }
   );

   if (result?.success === false) {
    console.error('[useCreatePayrollPeriod] ❌ Request failed:', {
     error: result.error,
     details: result.details,
    });
    throw new Error(result.error || 'Failed to create period');
   }

   console.log('[useCreatePayrollPeriod] ✅ Success:', result.data);
   return result.data;
  },
  onSuccess: (newPeriod) => {
   console.log('[useCreatePayrollPeriod] ✅ Mutation onSuccess');
   queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
   toast.success('Löneperiod skapad!');
  },
  onError: (error: Error) => {
   console.error('[useCreatePayrollPeriod] ❌ Mutation onError:', error);
   toast.error(`Kunde inte skapa period: ${error.message}`);
  },
 });
}

/**
 * Lås en löneperiod
 */
export function useLockPayrollPeriod(id: string) {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async (options?: { force?: boolean }) => {
   console.log('[useLockPayrollPeriod] Locking period...', { periodId: id, options });
   return await PayrollAPI.lock(id, options);
  },
  onSuccess: (result) => {
   if (result.success) {
    if (result.forced) {
     console.log('[useLockPayrollPeriod] ✅ Period force-locked', { periodId: id });
     toast.success('Period låstes (force)');
    } else {
     console.log('[useLockPayrollPeriod] ✅ Period locked', { periodId: id });
     toast.success('Period låst!');
    }
    queryClient.invalidateQueries({ queryKey: ['payroll-periods', id] });
    queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
    if (result.warnings && result.warnings.length) {
     toast.warning('Period låstes med varningar');
    }
   } else {
    console.warn('[useLockPayrollPeriod] ⚠️ Validation errors', {
     periodId: id,
     errors: result.errors,
    });
    // Errors hanteras i komponenten
   }
  },
  onError: (error: Error) => {
   console.error('[useLockPayrollPeriod] ❌ Failed', {
    periodId: id,
    error: error.message,
   });
   toast.error(`Kunde inte låsa period: ${error.message}`);
  },
 });
}

/**
 * Exportera en låst löneperiod
 * Prevents automatic retries to avoid API hammering (GPT-4o fix)
 * Enhanced error handling baserat på GPT-4o approach
 */
export function useExportPayrollPeriod(id: string) {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async () => {
   console.log('[useExportPayrollPeriod] 🚀 Mutation starting', { periodId: id });
   
   const result = await apiFetch<{
    success?: boolean;
    data?: { exportId?: string; signedUrl?: string; warnings?: string[] };
    warnings?: string[];
    error?: string;
   }>(`/api/payroll/periods/${id}/export`, {
    method: 'POST',
    credentials: 'include',
   });

   // Handle warnings as success (not errors)
   if (result.success && result.data) {
    // Merge warnings from API response into result
    const exportResult = {
     ...result.data,
     warnings: result.warnings ?? result.data.warnings ?? [],
    };

    console.log('[useExportPayrollPeriod] ✅ Success:', {
     periodId: id,
     exportId: exportResult.exportId,
     warnings: exportResult.warnings?.length || 0,
    });

    return exportResult;
   }

   throw new Error(result.error || 'No export data returned');
  },
  retry: false, // 🔒 Stop retry spam (GPT-4o recommendation)
  onSuccess: (result) => {
   console.log('[useExportPayrollPeriod] ✅ Mutation onSuccess', {
    periodId: id,
    exportId: result.exportId,
    warnings: result.warnings?.length || 0,
   });
   queryClient.invalidateQueries({ queryKey: ['payroll-periods', id] });
   queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });

   // Show success toast, warnings will be handled by ExportButton component
   if (result.warnings && result.warnings.length > 0) {
    toast.success('Export genomförd med varningar', {
     description: `${result.warnings.length} varning(ar) - se detaljer nedan`,
    });
   } else {
    toast.success('Export lyckades!');
   }

   // Öppna nedladdningslänk i ny flik
   if (result.signedUrl) {
    window.open(result.signedUrl, '_blank');
   }
  },
  onError: (error: Error) => {
   console.error('[useExportPayrollPeriod] ❌ Mutation onError:', {
    periodId: id,
    error: error.message,
   });
   toast.error(`Export misslyckades: ${error.message}`);
  },
 });
}

/**
 * Lås upp en period (admin only)
 */
export function useUnlockPayrollPeriod(id: string) {
 const queryClient = useQueryClient();

 return useMutation({
  mutationFn: async () => {
   console.log('[useUnlockPayrollPeriod] Unlocking period...', { periodId: id });
   return await PayrollAPI.unlock(id);
  },
  onSuccess: () => {
   console.log('[useUnlockPayrollPeriod] ✅ Period unlocked', { periodId: id });
   queryClient.invalidateQueries({ queryKey: ['payroll-periods', id] });
   queryClient.invalidateQueries({ queryKey: ['payroll-periods'] });
   toast.success('Period upplåst!');
  },
  onError: (error: Error) => {
   console.error('[useUnlockPayrollPeriod] ❌ Failed', {
    periodId: id,
    error: error.message,
   });
   toast.error(`Kunde inte låsa upp period: ${error.message}`);
  },
 });
}

