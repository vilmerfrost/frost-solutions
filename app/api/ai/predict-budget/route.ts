// app/api/ai/predict-budget/route.ts
import { NextRequest } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { templateBudget } from '@/lib/ai/templates';
import type { BudgetPrediction } from '@/types/ai';

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
    const currentProgress = budgetHours > 0 ? Math.min(100, (hours / budgetHours) * 100) : 0;

    // Enkel trend: sista 14 dagars snitt * återstående dagar ~ prox
    const sorted = (entries ?? []).sort(
      (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const recent = sorted.slice(-14);
    const avgDaily =
      recent.length > 0
        ? recent.reduce((a: any, b: any) => a + (parseFloat(b.hours_total || 0)), 0) /
          Math.max(new Set(recent.map((r: any) => r.date)).size, 1)
        : 0;

    // Gissa 10 arbetsdagar kvar (enkelt antagande)
    const predictedHours = hours + avgDaily * 10;
    const predictedFinal = predictedHours * rate;
    const budgetAmount = (project.budgeted_hours ?? 0) * rate;
    const budgetRemaining = Math.max(0, budgetAmount - currentSpend);

    let risk: 'low' | 'medium' | 'high' = 'low';
    if (budgetAmount > 0) {
      const over = predictedFinal - budgetAmount;
      if (over > budgetAmount * 0.15) {
        risk = 'high';
      } else if (over > budgetAmount * 0.05) {
        risk = 'medium';
      }
    }

    const prediction: BudgetPrediction = {
      currentSpend,
      budgetRemaining,
      currentProgress: Math.round(currentProgress),
      predictedFinal: Math.round(predictedFinal),
      riskLevel: risk,
      suggestions: [],
      confidence: recent.length >= 5 ? 'medium' : 'low',
    };

    return ok({ prediction: templateBudget(prediction) });
  } catch (e) {
    return fail(e, 'Kunde inte beräkna budgetprognos.');
  }
}

