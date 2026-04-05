import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache';
import { enforceRateLimit } from '@/lib/ai/ratelimit';
import { callOpenRouter } from '@/lib/ai/openrouter';
import type { ProjectPlan } from '@/types/ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en erfaren projektledare inom svensk bygg- och anläggningsbransch.
Skapa en detaljerad projektplan baserad på den givna projektinformationen.
Ta hänsyn till svenska byggstandarder, arbetsmiljökrav och vanliga leveranstider.

Svara alltid med JSON i detta format:
{
  "phases": [
    {
      "name": "string",
      "duration": number (dagar),
      "resources": number (personer),
      "description": "string",
      "order": number
    }
  ],
  "totalDays": number,
  "bufferDays": number,
  "riskFactors": ["string"],
  "recommendedTeamSize": number,
  "confidenceLevel": "low"|"medium"|"high"
}

Inkludera alltid en buffert på ca 15% av totaltiden.`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return fail(new Error('Ingen tenant'), 'Kunde inte identifiera organisation.');
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

    const [{ data: project, error: projectError }, { data: timeEntries }] =
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

    const usedHours = (timeEntries ?? []).reduce((a: any, b: any) => a + parseFloat(b.hours_total || 0), 0);
    const totalHours = usedHours + (project.budgeted_hours ?? 0);

    const cacheKey = makeCacheKey(tenantId, { projectId, totalHours });
    try {
      const cached = await getCached(tenantId, cacheKey);
      if (cached && typeof cached === 'object') {
        return ok({ plan: cached as ProjectPlan, model: 'gemini', cached: true });
      }
    } catch {
      // Non-blocking
    }

    const userPrompt = JSON.stringify({
      project: { name: project.name, estimatedHours: totalHours },
      constraints: { workDays: 5, maxParallelTeams: 2 },
    });

    const plan = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    try {
      await setCached(tenantId, cacheKey, plan, 86400);
    } catch {
      // Non-blocking
    }

    return ok({ plan, model: 'gemini', cached: false });
  } catch (e) {
    return fail(e, 'Kunde inte generera projektplan.');
  }
}
