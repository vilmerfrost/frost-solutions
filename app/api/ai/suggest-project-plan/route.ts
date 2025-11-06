// app/api/ai/suggest-project-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { makeCacheKey, getFromCache, setCache } from '@/lib/ai/cache';
import { enforceRateLimit } from '@/lib/ai/ratelimit';
import { claudeJSON } from '@/lib/ai/claude';
import { templateProjectPlan } from '@/lib/ai/templates';
import type { ProjectPlan } from '@/types/ai';

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

    try {
      await enforceRateLimit(tenantId, 'project-plan', 3);
    } catch (rateLimitError: any) {
      return NextResponse.json(
        { success: false, error: rateLimitError.message || 'Rate limit uppnådd.' },
        { status: 429 }
      );
    }

    const admin = createAdminClient();

    const [{ data: project, error: projectError }, { data: timeEntries, error: entriesError }] =
      await Promise.all([
        admin
          .from('projects')
          .select('id, name, budgeted_hours')
          .eq('tenant_id', tenantId)
          .eq('id', projectId)
          .maybeSingle(),
        admin
          .from('time_entries')
          .select('hours_total')
          .eq('tenant_id', tenantId)
          .eq('project_id', projectId),
      ]);

    if (projectError || !project) {
      return fail(new Error('Projekt saknas'), 'Projekt hittades inte.');
    }

    const totalHours =
      (timeEntries ?? []).reduce((a: any, b: any) => a + (parseFloat(b.hours_total || 0)), 0) +
      (project.budgeted_hours ?? 0);
    const complex = totalHours > 50;

    const cacheKey = makeCacheKey({ projectId, totalHours, complex });
    const cached = await getFromCache<ProjectPlan>(tenantId, 'project-plan', cacheKey);
    if (cached.hit && cached.data) {
      return ok({
        plan: cached.data,
        model: complex ? 'claude-sonnet' : 'claude-haiku',
        cached: true,
      });
    }

    const model = complex ? 'claude-3-5-sonnet-latest' : 'claude-3-5-haiku-latest';
    const system = 'Du är projektledare inom bygg. Ge endast JSON enligt format.';
    const user = JSON.stringify({
      project: { name: project.name, estimatedHours: totalHours },
      constraints: { workDays: 5, maxParallelTeams: 2 },
      format: {
        phases: [
          { name: 'string', duration: 'days', resources: 'int', description: 'string', order: 'int' },
        ],
        totalDays: 'int',
        bufferDays: 'int',
        riskFactors: ['string'],
        recommendedTeamSize: 'int',
        confidenceLevel: 'low|medium|high',
      },
    });

    let plan: ProjectPlan | null = null;

    try {
      const res = await claudeJSON(model as any, system, user, 1200);
      if (res?._raw) {
        throw new Error('Non-JSON');
      }

      plan = {
        phases: Array.isArray(res.phases) ? res.phases : templateProjectPlan(!complex).phases,
        totalDays: Number(res.totalDays ?? 10),
        bufferDays: Number(res.bufferDays ?? 2),
        riskFactors: Array.isArray(res.riskFactors) ? res.riskFactors : ['Resursbrist'],
        recommendedTeamSize: Number(res.recommendedTeamSize ?? 2),
        confidenceLevel: (['low', 'medium', 'high'].includes(res.confidenceLevel)
          ? res.confidenceLevel
          : 'medium') as 'low' | 'medium' | 'high',
      } as ProjectPlan;
    } catch (error) {
      console.error('Claude API error:', error);
      plan = templateProjectPlan(!complex);
    }

    if (plan) {
      await setCache(
        tenantId,
        'project-plan',
        cacheKey,
        plan,
        14,
        complex ? 'claude-sonnet' : 'claude-haiku'
      );
    }

    return ok({
      plan: plan || templateProjectPlan(!complex),
      model: complex ? 'claude-sonnet' : 'claude-haiku',
      cached: false,
    });
  } catch (e) {
    return fail(e, 'Kunde inte generera projektplan.');
  }
}

