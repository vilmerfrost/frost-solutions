import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { templateBudget } from '@/lib/ai/templates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en byggekonom som analyserar projektbudgetar. Baserat på historisk data, gör en prognos.

Regler:
1. Beräkna trend baserat på historik
2. Prediktera slutkostnad
3. Bedöm risk (low/medium/high)
4. Ge konkreta förslag

Svara alltid med JSON i detta format:
{
 "currentSpend": number,
 "budgetRemaining": number,
 "currentProgress": number (0-100),
 "predictedFinal": number,
 "riskLevel": "low" | "medium" | "high",
 "suggestions": ["string"],
 "confidence": "low" | "medium" | "high"
}`;

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

    const userPrompt = `Analysera projektbudget:
Budgeterade timmar: ${budgetHours}
Arbetade timmar: ${hours}
Timpris: ${rate} SEK
Nuvarande kostnad: ${currentSpend} SEK
Antal tidsrapporter: ${(entries ?? []).length}

Historik (senaste 5):
${(entries ?? []).slice(-5).map((e: any) => `- ${e.date}: ${e.hours_total}h`).join('\n') || 'Ingen historik'}`;

    const prediction = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    return ok({ prediction: templateBudget(prediction) });
  } catch (e) {
    return fail(e, 'Kunde inte beräkna budgetprognos.');
  }
}
