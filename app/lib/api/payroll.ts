// app/lib/api/payroll.ts
import { apiFetch } from '@/lib/http/fetcher';
import { extractErrorMessage } from '@/lib/errorUtils';
import type {
 PayrollPeriod,
 PayrollPeriodFilters,
 CreatePayrollPeriodPayload,
 PayrollExportResult,
} from '@/types/payroll';

interface ApiResponse<T> {
 success: boolean;
 data?: T;
 errors?: any[];
 warnings?: any[];
}

interface LockResponse {
 success: boolean;
 errors?: any[];
 warnings?: any[];
 forced?: boolean;
}

export class PayrollAPI {
 /**
  * Lista alla löneperioder med filters
  */
 static async list(filters?: PayrollPeriodFilters): Promise<PayrollPeriod[]> {
  console.log('[PayrollAPI.list] Starting request', { filters });

  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.start) params.set('start', filters.start);
  if (filters?.end) params.set('end', filters.end);

  try {
   const url = `/api/payroll/periods?${params}`;
   console.log('[PayrollAPI.list] Fetching:', url);

   const result = await apiFetch<ApiResponse<PayrollPeriod[]>>(url, {
    credentials: 'include',
   });

   console.log('[PayrollAPI.list] ✅ Success', {
    count: result.data?.length || 0,
   });

   return result.data || [];
  } catch (error: any) {
   console.error('[PayrollAPI.list] ❌ Exception', {
    error: error.message,
   });
   throw error;
  }
 }

 /**
  * Hämta en specifik löneperiod (använder list och filtrerar)
  */
 static async get(id: string): Promise<PayrollPeriod> {
  console.log('[PayrollAPI.get] Starting request', { periodId: id });

  try {
   // Använd list och filtrera på id (eftersom vi inte har GET /api/payroll/periods/[id])
   const periods = await PayrollAPI.list();
   const period = periods.find(p => p.id === id);

   if (!period) {
    throw new Error('Löneperiod hittades inte');
   }

   console.log('[PayrollAPI.get] ✅ Success', { periodId: id });
   return period;
  } catch (error: any) {
   console.error('[PayrollAPI.get] ❌ Exception', {
    periodId: id,
    error: error.message,
   });
   throw error;
  }
 }

 /**
  * Skapa ny löneperiod
  */
 static async create(payload: CreatePayrollPeriodPayload): Promise<PayrollPeriod> {
  console.log('[PayrollAPI.create] Starting request', { payload });

  try {
   const result = await apiFetch<ApiResponse<PayrollPeriod>>('/api/payroll/periods', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify(payload),
   });

   if (!result.data) {
    throw new Error('No period data returned');
   }

   console.log('[PayrollAPI.create] ✅ Success', {
    periodId: result.data.id,
   });

   return result.data;
  } catch (error: any) {
   console.error('[PayrollAPI.create] ❌ Exception', {
    error: error.message,
   });
   throw error;
  }
 }

 /**
  * Lås en löneperiod
  */
 static async lock(id: string, options?: { force?: boolean }): Promise<LockResponse> {
  console.log('[PayrollAPI.lock] Starting request', { periodId: id });

  try {
   const url = options?.force ? `/api/payroll/periods/${id}/lock?force=true` : `/api/payroll/periods/${id}/lock`;
   const fetchOptions: RequestInit = {
    method: 'POST',
    credentials: 'include',
   };

   if (options?.force) {
    fetchOptions.body = JSON.stringify({ force: true });
   }

   // Note: Lock endpoint may return 409 for validation errors, which apiFetch will throw on
   // We need to catch and handle this specially
   try {
    const result = await apiFetch<{ errors?: any[]; warnings?: any[]; forced?: boolean }>(url, fetchOptions);
    console.log('[PayrollAPI.lock] ✅ Success', { periodId: id, forced: result.forced, warnings: result.warnings?.length || 0 });
    return { success: true, warnings: result.warnings ?? [], forced: result.forced ?? false };
   } catch (error: any) {
    // Check if this is a validation error (409)
    if (error.message?.includes('409') || error.message?.includes('validation')) {
     console.warn('[PayrollAPI.lock] ⚠️ Validation errors', { periodId: id });
     return { success: false, errors: [] };
    }
    throw error;
   }
  } catch (error: any) {
   console.error('[PayrollAPI.lock] ❌ Exception', {
    periodId: id,
    error: error.message,
   });
   throw error;
  }
 }

 /**
  * Exportera en låst löneperiod
  * Handles warnings properly (GPT-4o fix)
  */
 static async export(id: string): Promise<PayrollExportResult> {
  console.log('[PayrollAPI.export] Starting request', { periodId: id });

  try {
   const result = await apiFetch<ApiResponse<PayrollExportResult>>(`/api/payroll/periods/${id}/export`, {
    method: 'POST',
    credentials: 'include',
   });

   // Handle warnings as success (not errors)
   if (result.success && result.data) {
    // Merge warnings from API response into result
    const exportResult: PayrollExportResult = {
     ...result.data,
     warnings: result.warnings ?? result.data.warnings ?? [],
    };

    console.log('[PayrollAPI.export] ✅ Success', {
     periodId: id,
     exportId: exportResult.exportId,
     warnings: exportResult.warnings?.length || 0,
    });

    return exportResult;
   }

   // Fallback if no data
   throw new Error('No export data returned');
  } catch (error: any) {
   console.error('[PayrollAPI.export] ❌ Exception', {
    periodId: id,
    error: error.message,
   });
   throw error;
  }
 }

 /**
  * Lås upp en period (admin only)
  */
 static async unlock(id: string): Promise<{ success: boolean }> {
  console.log('[PayrollAPI.unlock] Starting request', { periodId: id });

  try {
   await apiFetch(`/api/payroll/periods/${id}/unlock`, {
    method: 'POST',
    credentials: 'include',
   });

   console.log('[PayrollAPI.unlock] ✅ Success', { periodId: id });
   return { success: true };
  } catch (error: any) {
   console.error('[PayrollAPI.unlock] ❌ Exception', {
    periodId: id,
    error: error.message,
   });
   throw error;
  }
 }
}

