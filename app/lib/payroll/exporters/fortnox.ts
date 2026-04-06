import { createAdminClient } from '@/utils/supabase/admin';
import { uploadAndSignExport } from '../storage';
import { buildPAXml } from '../formats/paxml';
import { fetchEmployeesForPayroll } from './helpers';
import { PayrollExportResult, PayrollValidationIssue } from '@/types/payroll';

/**
 * Exports PAXml 2.2 to storage and returns signed URL.
 *
 * TODO: Real-time sync to Fortnox Lön API is NOT implemented.
 * Currently exports are saved to Supabase Storage only.
 * To enable: implement syncToFortnox() using the Fortnox API
 * and call it after a successful export.
 */
export async function exportFortnoxPAXml(opts: {
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

 console.log('[Fortnox Export] 🔍 Detecting time_entry columns...');
 const timeEntryColumnCheck = await getAvailableTimeEntryColumns(admin, tenantId);

 console.log('[Fortnox Export] 📊 Time entry columns:', {
  available: timeEntryColumnCheck.available.length,
  missing: timeEntryColumnCheck.missing.length,
  method: timeEntryColumnCheck.method,
 });

 // Generate warnings for missing columns
 const timeEntryWarnings = generateTimeEntryColumnWarnings(timeEntryColumnCheck.missing);
 warningList.push(...timeEntryWarnings);

 // Build safe SELECT query
 const timeEntrySelectQuery = buildTimeEntrySelectQuery(timeEntryColumnCheck.available);
 console.log('[Fortnox Export] 📝 Using SELECT query:', timeEntrySelectQuery);

 const { data: entries, error: entriesError } = await admin
  .from('time_entries')
  .select(timeEntrySelectQuery)
  .eq('tenant_id', tenantId)
  .gte('date', period.start_date)
  .lte('date', period.end_date);

 if (entriesError) {
  throw entriesError;
 }

 const { data: tenant } = await admin
  .from('tenants')
  .select('org_number, name')
  .eq('id', tenantId)
  .maybeSingle();

 if (!tenant?.org_number) {
  throw new Error(
   'Organisationsnummer saknas. Lägg till det under Inställningar innan du exporterar lön.'
  );
 }

 const paxml = buildPAXml({
  company: { orgNumber: tenant.org_number },
  period: { start: period.start_date, end: period.end_date },
  employees: employees ?? [],
  entries: entries ?? []
 });

 // Upload
 const fileName = `paxml_${periodId}.xml`;
 const { filePath, signedUrl } = await uploadAndSignExport(
  tenantId, 
  fileName, 
  Buffer.from(paxml, 'utf8'), 
  'application/xml'
 );

 await admin.from('payroll_exports').update({
  status: 'success',
  file_path: filePath
 }).eq('id', auditId);

 return {
  exportId: auditId,
  filePath,
  signedUrl,
  provider: 'fortnox' as const,
  format: 'paxml' as const,
  warnings: warningList,
  synced: false,
  message: 'Export sparad. Automatisk synkning till Fortnox är inte aktiverad — importera filen manuellt.',
 };
}

