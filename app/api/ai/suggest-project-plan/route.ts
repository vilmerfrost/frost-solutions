// app/api/ai/suggest-project-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache';
import { enforceRateLimit } from '@/lib/ai/ratelimit';
import { generateProjectPlan } from '@/lib/ai/frost-bygg-ai-integration';
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

  const cacheKey = makeCacheKey(tenantId, { projectId, totalHours, complex });
  try {
   const cached = await getCached(tenantId, cacheKey);
   if (cached && typeof cached === 'object') {
    const cachedData = cached as ProjectPlan;
    return ok({
     plan: cachedData,
     model: 'gemini-2.5-flash',
     cached: true,
    });
   }
  } catch (cacheError) {
   // Cache errors shouldn't block the request
   if (process.env.NODE_ENV === 'development') {
    console.warn('Cache read error (non-blocking):', cacheError);
   }
  }

  let plan: ProjectPlan | null = null;

  try {
   // Use Gemini 2.5 Flash via integration library
   plan = await generateProjectPlan({
    name: project.name,
    estimatedHours: totalHours
   });
  } catch (e) {
   console.error('Gemini error:', e);
   // Fallback to template
   plan = templateProjectPlan(project.name, totalHours);
  }

  if (plan) {
   await setCached(tenantId, cacheKey, plan, 60 * 60 * 24); // Cache 24h
  }

  return ok({
   plan: plan || templateProjectPlan(project.name, totalHours),
   model: 'gemini-2.5-flash',
   cached: false,
  });
 } catch (e) {
  return fail(e, 'Kunde inte generera projektplan.');
 }
}
