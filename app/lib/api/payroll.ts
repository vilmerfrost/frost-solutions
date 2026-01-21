// app/lib/api/payroll.ts
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

   const res = await fetch(url, {
    credentials: 'include',
   });

   console.log('[PayrollAPI.list] Response status:', res.status);

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({
     error: `HTTP ${res.status}: ${res.statusText}`,
    }));

    console.error('[PayrollAPI.list] ❌ Request failed', {
     status: res.status,
     error: errorData.error,
    });

    throw new Error(extractErrorMessage(errorData.error || `Failed to fetch payroll periods (${res.status})`));
   }

   const result: ApiResponse<PayrollPeriod[]> = await res.json();

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
   const res = await fetch('/api/payroll/periods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
   });

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({
     error: `HTTP ${res.status}: ${res.statusText}`,
    }));

    console.error('[PayrollAPI.create] ❌ Failed', {
     status: res.status,
     error: errorData.error,
    });

    throw new Error(extractErrorMessage(errorData.error || 'Failed to create payroll period'));
   }

   const result: ApiResponse<PayrollPeriod> = await res.json();

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
    fetchOptions.headers = { 'Content-Type': 'application/json' };
    fetchOptions.body = JSON.stringify({ force: true });
   }

   const res = await fetch(url, fetchOptions);

   const result = await res.json();

   if (res.status === 409) {
    // Validation errors
    console.warn('[PayrollAPI.lock] ⚠️ Validation errors', {
     periodId: id,
     errors: result.errors,
    });
    return { success: false, errors: result.errors };
   }

   if (!res.ok) {
    console.error('[PayrollAPI.lock] ❌ Failed', {
     status: res.status,
     error: result.error,
    });
    throw new Error(extractErrorMessage(result.error || 'Failed to lock period'));
   }

   console.log('[PayrollAPI.lock] ✅ Success', { periodId: id, forced: result.forced, warnings: result.warnings?.length || 0 });

   return { success: true, warnings: result.warnings ?? [], forced: result.forced ?? false };
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
   const res = await fetch(`/api/payroll/periods/${id}/export`, {
    method: 'POST',
    credentials: 'include',
   });

   const result: ApiResponse<PayrollExportResult> = await res.json().catch(() => ({
    success: false,
    errors: [`HTTP ${res.status}: ${res.statusText}`],
   }));

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

   // Only throw on actual errors (not warnings)
   if (!res.ok) {
    const errorData = (result.errors && result.errors[0]) || `HTTP ${res.status}: ${res.statusText}`;

    console.error('[PayrollAPI.export] ❌ Failed', {
     status: res.status,
     error: errorData,
    });

    throw new Error(extractErrorMessage(errorData));
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
   const res = await fetch(`/api/payroll/periods/${id}/unlock`, {
    method: 'POST',
    credentials: 'include',
   });

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({
     error: `HTTP ${res.status}: ${res.statusText}`,
    }));

    console.error('[PayrollAPI.unlock] ❌ Failed', {
     status: res.status,
     error: errorData.error,
    });

    throw new Error(extractErrorMessage(errorData.error || 'Failed to unlock period'));
   }

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

