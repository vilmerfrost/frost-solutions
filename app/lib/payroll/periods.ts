import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { PayrollPeriod, PayrollValidationIssue } from '@/types/payroll';
import { validateForExport } from './validation';
import { exportFortnoxPAXml } from './exporters/fortnox';
import { exportVismaCSV } from './exporters/visma';

interface LockPeriodResult {
  ok: boolean;
  errors: PayrollValidationIssue[];
  warnings?: PayrollValidationIssue[];
  forced?: boolean;
}

export async function listPeriods(filters?: { status?: string; start?: string; end?: string }) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error('Unauthorized');
  const admin = createAdminClient();

  let q = admin
    .from('payroll_periods')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('start_date', { ascending: false });

  if (filters?.status) q = q.eq('status', filters.status);
  if (filters?.start) q = q.gte('start_date', filters.start);
  if (filters?.end) q = q.lte('end_date', filters.end);

  const { data, error } = await q;
  if (error) throw error;
  return data as PayrollPeriod[];
}

export async function createPeriod(payload: { 
  startDate: string; 
  endDate: string; 
  format: 'fortnox-paxml' | 'visma-csv' 
}) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('[createPeriod] 🚀 STARTING');
  console.log('[createPeriod] Payload:', JSON.stringify(payload, null, 2));
  
  const tenantId = await getTenantId();
  if (!tenantId) {
    console.error('[createPeriod] ❌ No tenant ID found');
    throw new Error('Unauthorized');
  }
  
  console.log('[createPeriod] Tenant ID:', tenantId);
  const admin = createAdminClient();

  console.log('[createPeriod] Inserting period into database...');
  const { data, error } = await admin
    .from('payroll_periods')
    .insert({
      tenant_id: tenantId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      export_format: payload.format,
      status: 'open'
    })
    .select('*')
    .single();

  if (error) {
    console.error('[createPeriod] ❌ Database error:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  if (!data) {
    console.error('[createPeriod] ❌ No data returned from insert');
    throw new Error('No data returned from database');
  }

  console.log('[createPeriod] ✅ Period created successfully:', {
    periodId: data.id,
    startDate: data.start_date,
    endDate: data.end_date,
    status: data.status,
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return data as PayrollPeriod;
}

export async function lockPeriod(periodId: string, userId: string, options?: { force?: boolean }): Promise<LockPeriodResult> {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error('Unauthorized');
  const admin = createAdminClient();
  const force = !!options?.force;

  // 1) TS validation
  const { errors } = await validateForExport(tenantId, periodId);
  const validationIssues: PayrollValidationIssue[] = [...errors];

  // 2) DB validation (all entries approved)
  const { data: rows, error: vErr } = await admin.rpc('validate_timesheets_for_payroll', {
    p_tenant: tenantId,
    p_period: periodId
  });

  if (vErr) throw vErr;
  const notApproved = Number(rows?.[0]?.not_approved_count ?? 0);
  if (notApproved > 0) {
    if (!validationIssues.some(issue => issue.code === 'TIMESHEETS_NOT_APPROVED')) {
      validationIssues.push({
        code: 'TIMESHEETS_NOT_APPROVED',
        level: 'error',
        message: `${notApproved} tider ej godkända`
      });
    }
  }

  if (validationIssues.length && !force) {
    return { ok: false, errors: validationIssues };
  }

  // 3) Lock period
  const { error } = await admin.rpc('lock_payroll_period', { 
    p_tenant: tenantId, 
    p_period: periodId, 
    p_user: userId 
  });

  if (error) throw error;
  return { 
    ok: true, 
    errors: [] as PayrollValidationIssue[], 
    warnings: force ? validationIssues : undefined,
    forced: force && validationIssues.length > 0
  };
}

export async function unlockPeriod(periodId: string, userId: string) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error('Unauthorized');
  const admin = createAdminClient();

  const { error } = await admin.rpc('unlock_payroll_period', { 
    p_tenant: tenantId, 
    p_period: periodId, 
    p_user: userId 
  });

  if (error) throw error;
  return { ok: true };
}

export async function exportPeriod(periodId: string, userId: string) {
  const tenantId = await getTenantId();
  if (!tenantId) throw new Error('Unauthorized');
  const admin = createAdminClient();

  const { data: period, error: pErr } = await admin
    .from('payroll_periods')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', periodId)
    .maybeSingle();

  if (pErr || !period) {
    throw pErr || new Error('Period saknas');
  }

  const isRetryAfterFailure = period.status === 'failed';

  if (period.status !== 'locked' && !isRetryAfterFailure) {
    throw new Error('Period måste vara låst innan export');
  }

  if (isRetryAfterFailure) {
    const { error: relockError } = await admin
      .from('payroll_periods')
      .update({ status: 'locked' })
      .eq('tenant_id', tenantId)
      .eq('id', periodId);

    if (relockError) throw relockError;

    period.status = 'locked';
  }

  // Pre-export validation (again)
  const { errors, warnings } = await validateForExport(tenantId, periodId);
  if (errors.length) {
    await admin.from('payroll_exports').insert({
      tenant_id: tenantId,
      period_id: periodId,
      provider: period.export_format === 'visma-csv' ? 'visma' : 'fortnox',
      format: period.export_format === 'visma-csv' ? 'csv' : 'paxml',
      status: 'failed',
      error: JSON.stringify(errors)
    });
    throw new Error('Validering misslyckades');
  }

  const provider = period.export_format === 'visma-csv' ? 'visma' : 'fortnox';
  const format = provider === 'visma' ? 'csv' : 'paxml';

  // Create audit record (pending)
  const { data: audit, error: aErr } = await admin
    .from('payroll_exports')
    .insert({ 
      tenant_id: tenantId, 
      period_id: periodId, 
      provider, 
      format, 
      status: 'pending' 
    })
    .select('id')
    .single();

  if (aErr) throw aErr;

  try {
    const result = provider === 'visma'
      ? await exportVismaCSV({ tenantId, periodId, auditId: audit.id, warnings })
      : await exportFortnoxPAXml({ tenantId, periodId, auditId: audit.id, warnings });

    // Update period meta
    await admin
      .from('payroll_periods')
      .update({ 
        status: 'exported', 
        exported_at: new Date().toISOString(), 
        exported_by: userId 
      })
      .eq('tenant_id', tenantId)
      .eq('id', periodId);

    return result;
  } catch (e: any) {
    await admin
      .from('payroll_exports')
      .update({
        status: 'failed',
        error: e?.message?.toString() ?? 'export error'
      })
      .eq('id', audit.id);

    // Set status failed on period
    await admin
      .from('payroll_periods')
      .update({ status: 'failed' })
      .eq('id', periodId)
      .eq('tenant_id', tenantId);

    throw e;
  }
}

