// app/lib/payroll/employeeColumns.ts
// Robust column detection with caching and mutex protection
// Combines Claude 4.5's caching strategy with ChatGPT 5's RPC approach

import type { SupabaseClient } from '@supabase/supabase-js';
import type { PayrollValidationIssue } from '@/types/payroll';

interface ColumnCheckResult {
 available: string[];
 missing: string[];
 timestamp: number;
}

/**
 * Core employee columns that MUST exist
 */
const REQUIRED_COLUMNS = ['id', 'tenant_id', 'name', 'email'] as const;

/**
 * Optional payroll metadata columns
 */
const OPTIONAL_PAYROLL_COLUMNS = [
 'external_ids',
 'payroll_code',
 'hourly_rate_sek',
] as const;

type OptionalEmployeeColumn = (typeof OPTIONAL_PAYROLL_COLUMNS)[number];

// In-memory cache with TTL
const SCHEMA_CACHE = new Map<string, ColumnCheckResult>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Simple in-memory mutex for concurrent detection
const DETECTION_LOCKS = new Map<string, Promise<ColumnCheckResult>>();

/**
 * Check which columns exist in employees table
 * Uses admin client to bypass RLS
 * Implements caching and mutex protection to prevent race conditions
 */
export async function getAvailableEmployeeColumns(
 adminClient: SupabaseClient,
 tenantId: string
): Promise<ColumnCheckResult> {
 const cacheKey = `employees_${tenantId}`;

 // Check if detection is already in progress (mutex)
 const existingLock = DETECTION_LOCKS.get(cacheKey);
 if (existingLock) {
  console.log('[EmployeeColumns] ⏳ Detection in progress, waiting...');
  return existingLock;
 }

 // Check cache first
 const cached = SCHEMA_CACHE.get(cacheKey);
 if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
  console.log('[EmployeeColumns] 📦 Using cached schema', {
   available: cached.available.length,
   missing: cached.missing.length,
   age: Math.round((Date.now() - cached.timestamp) / 1000) + 's',
  });
  return cached;
 }

 // Create detection promise
 const detectionPromise = (async () => {
  try {
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   console.log('[EmployeeColumns] 🔍 STARTING COLUMN DETECTION');
   console.log('[EmployeeColumns] Tenant ID:', tenantId);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

   const allColumns = [
    ...REQUIRED_COLUMNS,
    ...OPTIONAL_PAYROLL_COLUMNS,
   ];
   const available: string[] = [];
   const missing: string[] = [];

   // Strategy 1: Try RPC function (most reliable - ChatGPT 5 approach)
   try {
    console.log('[EmployeeColumns] 🎯 Trying RPC method...');
    const { data: rpcData, error: rpcError } = await adminClient.rpc(
     'get_existing_columns',
     {
      p_table_schema: 'public',
      p_table_name: 'employees',
      p_candidates: [...allColumns],
     }
    );

    console.log('[EmployeeColumns] RPC response:', {
     hasData: !!rpcData,
     hasError: !!rpcError,
     dataLength: Array.isArray(rpcData) ? rpcData.length : 0,
     error: rpcError,
    });

    if (!rpcError && rpcData && Array.isArray(rpcData)) {
     const existingColumns = new Set(
      rpcData.map((r: { column_name: string }) => r.column_name)
     );

     for (const col of allColumns) {
      if (existingColumns.has(col)) {
       available.push(col);
      } else {
       missing.push(col);
      }
     }

     console.log('[EmployeeColumns] ✅ RPC SUCCESS:', {
      method: 'rpc',
      available: available.length,
      missing: missing.length,
      columns: available,
     });

     const result: ColumnCheckResult = {
      available,
      missing,
      timestamp: Date.now(),
     };
     SCHEMA_CACHE.set(cacheKey, result);
     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
     return result;
    } else {
     console.warn('[EmployeeColumns] ⚠️ RPC returned invalid data, falling back to probe');
    }
   } catch (error: any) {
    console.warn(
     '[EmployeeColumns] ⚠️ RPC detection failed, falling back to probe',
     {
      message: error.message,
      stack: error.stack,
     }
    );
   }

   // Strategy 2: Progressive probing (fallback if RPC not available)
   console.log('[EmployeeColumns] 🔬 Falling back to progressive probing method...');
   for (const col of allColumns) {
    try {
     const { error } = await adminClient
      .from('employees')
      .select(col)
      .eq('tenant_id', tenantId)
      .limit(1)
      .single();

     if (!error || error.code !== '42703') {
      // 42703 = column does not exist
      available.push(col);
      console.log(`[EmployeeColumns] ✅ Column ${col}: available`);
     } else {
      missing.push(col);
      console.log(`[EmployeeColumns] ❌ Column ${col}: missing`);
     }
    } catch (error: any) {
     console.warn(
      `[EmployeeColumns] ⚠️ Column ${col}: probe failed`,
      error
     );
     missing.push(col);
    }
   }

   console.log('[EmployeeColumns] ✅ PROBING COMPLETE:', {
    method: 'probe',
    available: available.length,
    missing: missing.length,
    missingColumns: missing,
   });

   const result: ColumnCheckResult = {
    available,
    missing,
    timestamp: Date.now(),
   };
   SCHEMA_CACHE.set(cacheKey, result);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   return result;
  } catch (error: any) {
   console.error('[EmployeeColumns] ❌ DETECTION FAILED:', {
    message: error.message,
    stack: error.stack,
   });
   // Return minimal fallback
   const fallbackResult: ColumnCheckResult = {
    available: ['id', 'tenant_id', 'name', 'email'],
    missing: [...OPTIONAL_PAYROLL_COLUMNS],
    timestamp: Date.now(),
   };
   console.log('[EmployeeColumns] 🆘 Using fallback columns');
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   return fallbackResult;
  } finally {
   // Always remove lock when done
   DETECTION_LOCKS.delete(cacheKey);
  }
 })();

 // Store lock
 DETECTION_LOCKS.set(cacheKey, detectionPromise);
 return detectionPromise;
}

/**
 * Build safe SELECT query for employees
 */
export function buildEmployeeSelectQuery(
 availableColumns: string[]
): string {
 // Always include required columns
 const selectColumns: string[] = REQUIRED_COLUMNS.filter((col) =>
  availableColumns.includes(col)
 );

 // Add optional columns if available
 for (const col of OPTIONAL_PAYROLL_COLUMNS) {
  if (availableColumns.includes(col)) {
   selectColumns.push(col);
  }
 }

 return selectColumns.join(', ');
}

/**
 * Generate warnings for missing columns
 */
export function generateMissingColumnWarnings(
 missingColumns: string[]
): PayrollValidationIssue[] {
 const warnings: PayrollValidationIssue[] = [];

 const payrollMissing = missingColumns.filter((col) =>
  OPTIONAL_PAYROLL_COLUMNS.includes(col as OptionalEmployeeColumn)
 );

 if (payrollMissing.length > 0) {
  warnings.push({
   code: 'MISSING_PAYROLL_COLUMNS',
   level: 'warning',
   message: `Följande kolumner saknas i employees-tabellen och kommer inte inkluderas i exporten: ${payrollMissing.join(', ')}. Kontrollera att din databas-schema är uppdaterad.`,
   context: { missingColumns: payrollMissing },
  });
 }

 // Critical warning if required columns are missing
 const requiredMissing = missingColumns.filter((col) =>
  REQUIRED_COLUMNS.includes(col as any)
 );

 if (requiredMissing.length > 0) {
  warnings.push({
   code: 'MISSING_REQUIRED_COLUMNS',
   level: 'error',
   message: `KRITISKT: Obligatoriska kolumner saknas: ${requiredMissing.join(', ')}. Export kan misslyckas.`,
   context: { missingColumns: requiredMissing },
  });
 }

 return warnings;
}

/**
 * Clear schema cache (call after migrations)
 */
export function clearEmployeeColumnsCache(tenantId?: string) {
 if (tenantId) {
  SCHEMA_CACHE.delete(`employees_${tenantId}`);
  console.log('[EmployeeColumns] 🗑️ Cleared cache for tenant', tenantId);
 } else {
  SCHEMA_CACHE.clear();
  console.log('[EmployeeColumns] 🗑️ Cleared all cache');
 }
}

