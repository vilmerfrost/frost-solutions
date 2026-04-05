import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache';
import { enforceRateLimit } from '@/lib/ai/ratelimit';
import { callOpenRouter } from '@/lib/ai/openrouter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en svensk byggekonom med erfarenhet av fakturering för bygg- och hantverksföretag.
Baserat på projektdata och tidrapporter, föreslå fakturarader med korrekt moms (25%), enhet och pris.
Ge ett komplett fakturaförslag.

Svara alltid med JSON i detta format:
{
  "totalAmount": number,
  "suggestedDiscount": number (0-100),
  "invoiceRows": [
    {
      "description": "string",
      "quantity": number,
      "unitPrice": number,
      "vat": 25,
      "amount": number
    }
  ],
  "notes": "string",
  "confidence": "low"|"medium"|"high"
}`;

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
      await enforceRateLimit(tenantId, 'invoice', 5);
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
          .select('id, name, client_id, base_rate_sek')
          .eq('tenant_id', tenantId)
          .eq('id', projectId)
          .maybeSingle(),
        admin
          .from('time_entries')
          .select('hours_total, ob_type')
          .eq('tenant_id', tenantId)
          .eq('project_id', projectId),
      ]);

    if (projectError || !project) {
      return fail(new Error('Projekt saknas'), 'Projekt hittades inte.');
    }

    const hours = (timeEntries ?? []).reduce((a: any, b: any) => a + parseFloat(b.hours_total || 0), 0);
    const baseRate = project.base_rate_sek ?? 600;

    const cacheKey = makeCacheKey(tenantId, { projectId, hrs: hours, baseRate });
    try {
      const cached = await getCached(tenantId, cacheKey);
      if (cached && typeof cached === 'object') {
        return ok({ suggestion: cached, model: 'gemini', cached: true });
      }
    } catch {
      // Non-blocking
    }

    const userPrompt = JSON.stringify({
      project: { name: project.name, baseRate },
      totalHours: Math.round(hours * 100) / 100,
      rules: { vat: 25, currency: 'SEK' },
    });

    const suggestion = await callOpenRouter(SYSTEM_PROMPT, userPrompt, { jsonMode: true });

    try {
      await setCached(tenantId, cacheKey, suggestion, 604800);
    } catch {
      // Non-blocking
    }

    return ok({ suggestion, model: 'gemini', cached: false });
  } catch (e) {
    return fail(e, 'Kunde inte ta fram faktureringsförslag.');
  }
}
