// app/lib/payroll/timeEntryColumns.ts
// Robust column detection for time_entries with caching and mutex protection
// Based on best practices from Claude 4.5, Gemini 2.5, ChatGPT 5, and Deepseek

import type { PayrollValidationIssue } from '@/types/payroll';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminClient = any;

interface ColumnCheckResult {
 available: string[];
 missing: string[];
 timestamp: number;
 method: 'rpc' | 'probe' | 'fallback';
}

/**
 * Core time entry columns that MUST exist for export to work
 */
const REQUIRED_TIME_ENTRY_COLUMNS = [
 'id',
 'tenant_id',
 'employee_id',
 'date',
 'hours_total',
] as const;

/**
 * Optional payroll-related columns that enhance export but aren't critical
 */
const OPTIONAL_TIME_ENTRY_COLUMNS = [
 'ob_type',
 'ot_type',
 'allowance_code',
 'absence_code',
] as const;

// In-memory cache with TTL (15 min for time_entries - longer than employees since schema changes less frequently)
const SCHEMA_CACHE = new Map<string, ColumnCheckResult>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes (Grok 4 + Claude 4.5 recommendation)

// Simple in-memory mutex for concurrent detection
const DETECTION_LOCKS = new Map<string, Promise<ColumnCheckResult>>();

/**
 * Check which columns exist in time_entries table
 * Uses admin client to bypass RLS
 * Implements caching and mutex protection to prevent race conditions
 * 
 * Based on Claude 4.5's comprehensive approach + ChatGPT 5's robust fallback
 */
export async function getAvailableTimeEntryColumns(
 adminClient: AdminClient,
 tenantId: string
): Promise<ColumnCheckResult> {
 const cacheKey = `time_entries_${tenantId}`;

 // Check if detection is already in progress (mutex)
 const existingLock = DETECTION_LOCKS.get(cacheKey);
 if (existingLock) {
  console.log('[TimeEntryColumns] ⏳ Detection in progress, waiting...');
  return existingLock;
 }

 // Check cache first
 const cached = SCHEMA_CACHE.get(cacheKey);
 if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
  console.log('[TimeEntryColumns] 📦 Using cached schema', {
   available: cached.available.length,
   missing: cached.missing.length,
   method: cached.method,
   age: Math.round((Date.now() - cached.timestamp) / 1000) + 's',
  });
  return cached;
 }

 // Create detection promise
 const detectionPromise = (async () => {
  try {
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   console.log('[TimeEntryColumns] 🔍 STARTING COLUMN DETECTION');
   console.log('[TimeEntryColumns] Tenant ID:', tenantId);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

   const allColumns = [
    ...REQUIRED_TIME_ENTRY_COLUMNS,
    ...OPTIONAL_TIME_ENTRY_COLUMNS,
   ];
   const available: string[] = [];
   const missing: string[] = [];

   // Strategy 1: Try RPC function (most reliable - ChatGPT 5 approach)
   try {
    console.log('[TimeEntryColumns] 🎯 Trying RPC method...');
    const { data: rpcData, error: rpcError } = await adminClient.rpc(
     'get_existing_columns',
     {
      p_table_schema: 'public',
      p_table_name: 'time_entries',
      p_candidates: [...allColumns],
     }
    );

    console.log('[TimeEntryColumns] RPC response:', {
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

     console.log('[TimeEntryColumns] ✅ RPC SUCCESS:', {
      method: 'rpc',
      available: available.length,
      missing: missing.length,
      columns: available,
     });

     const result: ColumnCheckResult = {
      available,
      missing,
      timestamp: Date.now(),
      method: 'rpc',
     };
     SCHEMA_CACHE.set(cacheKey, result);
     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
     return result;
    } else {
     console.warn('[TimeEntryColumns] ⚠️ RPC returned invalid data, falling back to probe');
    }
   } catch (error: any) {
    console.warn(
     '[TimeEntryColumns] ⚠️ RPC detection failed, falling back to probe',
     {
      message: error.message,
      stack: error.stack,
     }
    );
   }

   // Strategy 2: Progressive probing (fallback if RPC not available)
   // ChatGPT 5's SELECT * LIMIT 1 approach for robust fallback
   console.log('[TimeEntryColumns] 🔬 Falling back to progressive probing method...');
   
   // First try SELECT * LIMIT 1 to get all available columns at once (ChatGPT 5 approach)
   try {
    const { data: sampleRow, error: sampleError } = await adminClient
     .from('time_entries')
     .select('*')
     .eq('tenant_id', tenantId)
     .limit(1)
     .maybeSingle();

    if (!sampleError && sampleRow) {
     const existingKeys = new Set(Object.keys(sampleRow));
     
     for (const col of allColumns) {
      if (existingKeys.has(col)) {
       available.push(col);
      } else {
       missing.push(col);
      }
     }

     console.log('[TimeEntryColumns] ✅ PROBING SUCCESS (SELECT *):', {
      method: 'probe',
      available: available.length,
      missing: missing.length,
     });

     const result: ColumnCheckResult = {
      available,
      missing,
      timestamp: Date.now(),
      method: 'probe',
     };
     SCHEMA_CACHE.set(cacheKey, result);
     console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
     return result;
    }
   } catch (error: any) {
    console.warn('[TimeEntryColumns] ⚠️ SELECT * probe failed, trying individual probes');
   }

   // Strategy 3: Individual column probing (Deepseek's progressive approach)
   for (const col of allColumns) {
    try {
     const { error } = await adminClient
      .from('time_entries')
      .select(col)
      .eq('tenant_id', tenantId)
      .limit(1);

     if (!error || error.code !== '42703') {
      // 42703 = column does not exist
      available.push(col);
      console.log(`[TimeEntryColumns] ✅ Column ${col}: available`);
     } else {
      missing.push(col);
      console.log(`[TimeEntryColumns] ❌ Column ${col}: missing`);
     }
    } catch (error: any) {
     console.warn(
      `[TimeEntryColumns] ⚠️ Column ${col}: probe failed`,
      error
     );
     missing.push(col);
    }
   }

   console.log('[TimeEntryColumns] ✅ PROBING COMPLETE:', {
    method: 'probe',
    available: available.length,
    missing: missing.length,
    missingColumns: missing,
   });

   const result: ColumnCheckResult = {
    available,
    missing,
    timestamp: Date.now(),
    method: 'probe',
   };
   SCHEMA_CACHE.set(cacheKey, result);
   console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
   return result;
  } catch (error: any) {
   console.error('[TimeEntryColumns] ❌ DETECTION FAILED:', {
    message: error.message,
    stack: error.stack,
   });
   // Return minimal fallback (Deepseek's approach)
   const fallbackResult: ColumnCheckResult = {
    available: [...REQUIRED_TIME_ENTRY_COLUMNS],
    missing: [...OPTIONAL_TIME_ENTRY_COLUMNS],
    timestamp: Date.now(),
    method: 'fallback',
   };
   console.log('[TimeEntryColumns] 🆘 Using fallback columns');
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
 * Build a safe SELECT query string based on available columns
 * Ensures required columns are always included
 */
export function buildTimeEntrySelectQuery(availableColumns: string[]): string {
 if (availableColumns.length === 0) {
  console.warn('[TimeEntryColumns] ⚠️ No columns available, using minimal fallback');
  return REQUIRED_TIME_ENTRY_COLUMNS.join(', ');
 }

 // Ensure required columns are always first
 const requiredPresent = REQUIRED_TIME_ENTRY_COLUMNS.filter((col) =>
  availableColumns.includes(col)
 );
 const optionalPresent = availableColumns.filter(
  (col) => !REQUIRED_TIME_ENTRY_COLUMNS.includes(col as any)
 );

 const finalColumns = [...requiredPresent, ...optionalPresent];

 console.log('[TimeEntryColumns] 📝 Built SELECT query:', {
  total: finalColumns.length,
  required: requiredPresent.length,
  optional: optionalPresent.length,
 });

 return finalColumns.join(', ');
}

/**
 * Generate warnings for missing time entry columns
 * Based on Claude 4.5's comprehensive warning system
 */
export function generateTimeEntryColumnWarnings(
 missingColumns: string[]
): PayrollValidationIssue[] {
 const warnings: PayrollValidationIssue[] = [];

 // Critical: Required columns missing
 const requiredMissing = missingColumns.filter((col) =>
  REQUIRED_TIME_ENTRY_COLUMNS.includes(col as any)
 );

 if (requiredMissing.length > 0) {
  warnings.push({
   code: 'MISSING_REQUIRED_TIME_ENTRY_COLUMNS',
   level: 'error',
   message: `KRITISKT: Obligatoriska time_entries kolumner saknas: ${requiredMissing.join(
    ', '
   )}. Export kan misslyckas helt.`,
  });
 }

 // Warning: Optional payroll columns missing
 const optionalMissing = missingColumns.filter((col) =>
  OPTIONAL_TIME_ENTRY_COLUMNS.includes(col as any)
 );

 if (optionalMissing.length > 0) {
  warnings.push({
   code: 'MISSING_OPTIONAL_TIME_ENTRY_COLUMNS',
   level: 'warning',
   message: `Följande time_entries kolumner saknas och kommer inte inkluderas: ${optionalMissing.join(
    ', '
   )}. Vissa lönefält kan bli tomma.`,
  });
 }

 return warnings;
}

/**
 * Clear cache for time entry columns
 * Useful after migrations or schema changes
 */
export function clearTimeEntryColumnsCache(tenantId?: string): void {
 if (tenantId) {
  const cacheKey = `time_entries_${tenantId}`;
  SCHEMA_CACHE.delete(cacheKey);
  console.log('[TimeEntryColumns] 🗑️ Cleared cache for tenant:', tenantId);
 } else {
  SCHEMA_CACHE.clear();
  console.log('[TimeEntryColumns] 🗑️ Cleared all time_entry column cache');
 }
}

