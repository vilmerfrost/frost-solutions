import { createAdminClient } from '@/utils/supabase/admin';
import { uploadAndSignExport } from '../storage';
import { buildVismaCSV } from '../formats/visma';
import { fetchEmployeesForPayroll } from './helpers';
import { PayrollExportResult, PayrollValidationIssue } from '@/types/payroll';

/**
 * Exports Visma CSV to storage and returns signed URL.
 */
export async function exportVismaCSV(opts: {
  tenantId: string;
  periodId: string;
  auditId: string;
  warnings?: PayrollValidationIssue[];
}): Promise<PayrollExportResult> {
  const admin = createAdminClient();
  const { tenantId, periodId, auditId } = opts;
  const warningList: PayrollValidationIssue[] = [...(opts.warnings ?? [])];

  const { data: period, error: periodError } = await admin
    .from('payroll_periods')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', periodId)
    .maybeSingle();

  if (periodError) {
    throw periodError;
  }

  if (!period) {
    throw new Error('Period not found');
  }

  const employees = await fetchEmployeesForPayroll(admin, tenantId, warningList);

  // Use dedicated time entry column detection module (long-term solution)
  const {
    getAvailableTimeEntryColumns,
    buildTimeEntrySelectQuery,
    generateTimeEntryColumnWarnings,
  } = await import('../timeEntryColumns');

  console.log('[Visma Export] 🔍 Detecting time_entry columns...');
  const timeEntryColumnCheck = await getAvailableTimeEntryColumns(admin, tenantId);

  console.log('[Visma Export] 📊 Time entry columns:', {
    available: timeEntryColumnCheck.available.length,
    missing: timeEntryColumnCheck.missing.length,
    method: timeEntryColumnCheck.method,
  });

  // Generate warnings for missing columns
  const timeEntryWarnings = generateTimeEntryColumnWarnings(timeEntryColumnCheck.missing);
  warningList.push(...timeEntryWarnings);

  // Build safe SELECT query
  const timeEntrySelectQuery = buildTimeEntrySelectQuery(timeEntryColumnCheck.available);
  console.log('[Visma Export] 📝 Using SELECT query:', timeEntrySelectQuery);

  const { data: entries, error: entriesError } = await admin
    .from('time_entries')
    .select(timeEntrySelectQuery)
    .eq('tenant_id', tenantId)
    .gte('date', period.start_date)
    .lte('date', period.end_date);

  if (entriesError) {
    throw entriesError;
  }

  const csv = buildVismaCSV({
    period: { start: period.start_date, end: period.end_date },
    employees: employees ?? [],
    entries: entries ?? []
  });

  const fileName = `visma_${periodId}.csv`;
  const { filePath, signedUrl } = await uploadAndSignExport(
    tenantId, 
    fileName, 
    Buffer.from(csv, 'utf8'), 
    'text/csv'
  );

  await admin.from('payroll_exports').update({
    status: 'success',
    file_path: filePath
  }).eq('id', auditId);

  return {
    exportId: auditId,
    filePath,
    signedUrl,
    provider: 'visma' as const,
    format: 'csv' as const,
    warnings: warningList
  };
}

