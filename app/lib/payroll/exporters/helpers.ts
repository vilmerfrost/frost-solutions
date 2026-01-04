import type { SupabaseClient } from '@supabase/supabase-js';
import type { PayrollValidationIssue } from '@/types/payroll';
import {
 getAvailableEmployeeColumns,
 buildEmployeeSelectQuery,
 generateMissingColumnWarnings,
} from '../employeeColumns';

type EmployeeRow = {
 id: string;
 external_ids?: Record<string, string> | null;
 payroll_code?: string | null;
 hourly_rate_sek?: number | null;
};

/**
 * Fetch employees for payroll export with robust column detection
 * Uses RPC-based column detection with caching (ChatGPT 5 + Claude 4.5 approach)
 */
export async function fetchEmployeesForPayroll(
 admin: SupabaseClient,
 tenantId: string,
 warningList: PayrollValidationIssue[]
): Promise<EmployeeRow[]> {
 console.log('[fetchEmployeesForPayroll] 🔍 Detecting available columns...');

 // Step 1: Detect available columns (with caching and mutex protection)
 const columnCheck = await getAvailableEmployeeColumns(admin, tenantId);

 console.log('[fetchEmployeesForPayroll] 📊 Column availability:', {
  available: columnCheck.available,
  missing: columnCheck.missing,
 });

 // Step 2: Generate warnings for missing columns
 const columnWarnings = generateMissingColumnWarnings(columnCheck.missing);
 warningList.push(...columnWarnings);

 // Step 3: Build safe SELECT query
 const selectQuery = buildEmployeeSelectQuery(columnCheck.available);
 console.log('[fetchEmployeesForPayroll] 📝 Using SELECT query:', selectQuery);

 // Step 4: Fetch employees with safe query
 let employees: EmployeeRow[];

 try {
  const { data, error } = await admin
   .from('employees')
   .select(selectQuery)
   .eq('tenant_id', tenantId);

  if (error) {
   console.error('[fetchEmployeesForPayroll] ❌ Employee query failed', error);

   // LAST RESORT: Fall back to absolute minimum
   console.log('[fetchEmployeesForPayroll] 🆘 Falling back to minimal query');

   const { data: minimalData, error: minimalError } = await admin
    .from('employees')
    .select('id, tenant_id, name, email')
    .eq('tenant_id', tenantId);

   if (minimalError) {
    throw new Error(
     `Failed to fetch employees even with minimal query: ${minimalError.message}`
    );
   }

   employees = (minimalData ?? []).map((employee: any) => ({
    id: employee.id,
    external_ids: {},
    payroll_code: null,
    hourly_rate_sek: null,
   }));

   warningList.push({
    code: 'FALLBACK_TO_MINIMAL',
    level: 'warning',
    message:
     'Kunde inte hämta full employee-data. Använder minimal information (id, name, email).',
   });
  } else {
   // Normalize employee data with defaults
   employees = (data ?? []).map((employee: any) => ({
    id: employee.id,
    external_ids: employee.external_ids ?? {},
    payroll_code: employee.payroll_code ?? null,
    hourly_rate_sek: employee.hourly_rate_sek ?? null,
   }));
  }
 } catch (error: any) {
  console.error('[fetchEmployeesForPayroll] ❌ Fatal error fetching employees', error);
  throw error;
 }

 console.log('[fetchEmployeesForPayroll] ✅ Fetched employees:', employees.length);

 return employees;
}


