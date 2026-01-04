import { createAdminClient } from '@/utils/supabase/admin';
import { PayrollValidationIssue } from '@/types/payroll';

/**
 * Validates timesheets for payroll export
 * Checks: employee mapping, approval status, OB/OT consistency
 */
export async function validateForExport(tenantId: string, periodId: string): Promise<{
 errors: PayrollValidationIssue[];
 warnings: PayrollValidationIssue[];
 context: { employees: any[]; entries: any[] };
}> {
 const admin = createAdminClient();
 const issuesErr: PayrollValidationIssue[] = [];
 const issuesWarn: PayrollValidationIssue[] = [];

 const { data: period, error: pErr } = await admin
  .from('payroll_periods')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('id', periodId)
  .maybeSingle();

 if (pErr || !period) {
  issuesErr.push({ code: 'PERIOD_NOT_FOUND', level: 'error', message: 'Löneperiod saknas' });
  return { errors: issuesErr, warnings: issuesWarn, context: { employees: [], entries: [] } };
 }

 const { data: employees } = await admin
  .from('employees')
  .select('id, auth_user_id, external_ids, hourly_rate_sek, payroll_code, tenant_id')
  .eq('tenant_id', tenantId);

 const { data: entries } = await admin
  .from('time_entries')
  .select('id, employee_id, date, hours_total, ob_type, ot_type, project_id, status')
  .eq('tenant_id', tenantId)
  .gte('date', period.start_date)
  .lte('date', period.end_date);

 // 1) Employee mapping - check for external IDs (Fortnox/Visma)
 for (const e of (employees ?? [])) {
  const ext = e?.external_ids as Record<string, string> | null;
  if (!ext?.fortnox_id && !ext?.visma_id) {
   issuesWarn.push({
    code: 'EMPLOYEE_ID_MISSING',
    level: 'warning',
    message: `Extern löne-ID saknas för anställd ${e.id}`,
    context: { employeeId: e.id }
   });
  }
 }

 // 2) Approved timesheets (application policy)
 const notApproved = (entries ?? []).filter(te => {
  // Check multiple possible approval fields
  return te.status !== 'approved' && 
      (te as any).approval_status !== 'approved' && 
      !(te as any).approved_at;
 }).length;

 if (notApproved > 0) {
  issuesErr.push({ 
   code: 'TIMESHEETS_NOT_APPROVED', 
   level: 'error', 
   message: `${notApproved} tidrader ej godkända` 
  });
 }

 // 3) OB/OT consistency check (basic validation)
 for (const te of (entries ?? [])) {
  // Basic check: OB and OT should not both be set
  if (te.ob_type && te.ot_type) {
   issuesErr.push({
    code: 'OB_OT_CONFLICT',
    level: 'error',
    message: `OB och ÖT kan inte kombineras för tidrad ${te.id}`,
    context: { timeEntryId: te.id }
   });
  }

  // Validate hours are positive and reasonable
  const hours = Number(te.hours_total ?? 0);
  if (hours <= 0 || hours > 24) {
   issuesErr.push({
    code: 'INVALID_HOURS',
    level: 'error',
    message: `Ogiltiga timmar (${hours}) för tidrad ${te.id}`,
    context: { timeEntryId: te.id, hours }
   });
  }
 }

 return { 
  errors: issuesErr, 
  warnings: issuesWarn, 
  context: { employees: employees ?? [], entries: entries ?? [] } 
 };
}

