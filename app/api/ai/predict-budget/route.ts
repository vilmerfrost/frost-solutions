// app/api/ai/predict-budget/route.ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { templateBudget } from '@/lib/ai/templates';
import { generateBudgetPrediction } from '@/lib/ai/frost-bygg-ai-integration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return fail(new Error('Ingen tenant hittades'), 'Kunde inte identifiera organisation.');
  }

  const { projectId } = await req.json();
  if (!projectId) {
   return fail(new Error('projectId saknas'), 'Projekt-ID saknas.');
  }

  const admin = createAdminClient();

  const { data: project, error: projectError } = await admin
   .from('projects')
   .select('id, budgeted_hours, base_rate_sek, status')
   .eq('tenant_id', tenantId)
   .eq('id', projectId)
   .maybeSingle();

  if (projectError || !project) {
   return ok({ prediction: templateBudget({ confidence: 'low' }) });
  }

  const { data: entries, error: entriesError } = await admin
   .from('time_entries')
   .select('hours_total, date')
   .eq('tenant_id', tenantId)
   .eq('project_id', projectId);

  if (entriesError) {
   console.error('Error fetching time entries:', entriesError);
  }

  const hours = (entries ?? []).reduce((a: any, b: any) => a + (parseFloat(b.hours_total || 0)), 0);
  const rate = project.base_rate_sek ?? 600;
  const currentSpend = hours * rate;
  const budgetHours = project.budgeted_hours ?? 0;

  // Use Gemini 2.5 Flash for prediction
  const prediction = await generateBudgetPrediction({
   projectId,
   totalHours: hours,
   budgetedHours: budgetHours,
   hourlyRate: rate,
   currentSpend,
   timeEntries: entries ?? [],
  });

  return ok({ prediction });
 } catch (e) {
  return fail(e, 'Kunde inte beräkna budgetprognos.');
 }
}
