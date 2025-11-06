// app/api/ai/suggest-invoice/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { createAdminClient } from '@/utils/supabase/admin';
import { makeCacheKey, getFromCache, setCache } from '@/lib/ai/cache';
import { enforceRateLimit } from '@/lib/ai/ratelimit';
import { claudeJSON } from '@/lib/ai/claude';
import { templateInvoiceSuggestion } from '@/lib/ai/templates';
import type { InvoiceSuggestion } from '@/types/ai';

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

    // Rate limit: 5 / min / tenant
    try {
      await enforceRateLimit(tenantId, 'invoice', 5);
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

    const hours = (timeEntries ?? []).reduce((a: any, b: any) => a + (parseFloat(b.hours_total || 0)), 0);
    const baseRate = project.base_rate_sek ?? 600;
    const roughTotal = Math.round(hours * baseRate);

    const cacheKey = makeCacheKey({ projectId, hrs: hours, baseRate });
    const cached = await getFromCache<InvoiceSuggestion>(tenantId, 'invoice', cacheKey);
    if (cached.hit && cached.data) {
      return ok({ suggestion: cached.data, model: 'claude-haiku', cached: true });
    }

    // Prompt (liten för kostnadsoptimering)
    const system =
      'Du är en svensk ekonom med erfarenhet från bygg. Ge JSON som svar, inga förklaringar.';
    const user = JSON.stringify({
      project: { name: project.name, baseRate },
      hours,
      rules: { vat: 25, currency: 'SEK' },
      format: {
        totalAmount: 'number',
        suggestedDiscount: 'number (0..100)',
        invoiceRows: [
          {
            description: 'string',
            quantity: 'number',
            unitPrice: 'number',
            vat: 'number',
            amount: 'number',
          },
        ],
        notes: 'string',
        confidence: 'low|medium|high',
      },
    });

    let suggestion: InvoiceSuggestion | null = null;

    try {
      const res = await claudeJSON('claude-3-5-haiku-latest', system, user, 900);
      if (res?._raw) {
        throw new Error('Non-JSON');
      }

      suggestion = {
        totalAmount: Number(res.totalAmount ?? roughTotal),
        suggestedDiscount: Number(res.suggestedDiscount ?? 0),
        invoiceRows: Array.isArray(res.invoiceRows)
          ? res.invoiceRows
          : [
              {
                description: 'Arbetstid',
                quantity: Math.round(hours * 100) / 100, // Round to 2 decimals
                unitPrice: baseRate,
                vat: 25,
                amount: roughTotal,
              },
            ],
        notes: String(res.notes ?? 'AI-genererat förslag'),
        confidence: (['low', 'medium', 'high'].includes(res.confidence)
          ? res.confidence
          : 'medium') as 'low' | 'medium' | 'high',
      };
    } catch (error) {
      console.error('Claude API error:', error);
      suggestion = templateInvoiceSuggestion(roughTotal);
    }

    if (suggestion) {
      await setCache(tenantId, 'invoice', cacheKey, suggestion, 7, 'claude-haiku');
    }

    return ok({
      suggestion: suggestion || templateInvoiceSuggestion(roughTotal),
      model: 'claude-haiku',
      cached: false,
    });
  } catch (e) {
    return fail(e, 'Kunde inte ta fram faktureringsförslag.');
  }
}

