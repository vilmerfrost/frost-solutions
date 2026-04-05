import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { callOpenRouter } from '@/lib/ai/openrouter';
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `Du är en senior ekonom och projektledare i svenska byggbranschen.
Sammanfatta den givna datan koncist på svenska. Fokusera på status, nyckeltal och handlingspunkter.
Max 150 ord. Svara med ren text, ingen JSON.`;

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const cacheTenantId = tenantId;

    const { resourceType, type, data } = await req.json();
    const actualType = resourceType || type;

    if (!actualType || !data) {
      return fail(new Error('type eller data saknas'), 'Ogiltig begäran.');
    }

    const userPrompt = buildPrompt(actualType, data);
    if (!userPrompt) {
      return fail(new Error('Invalid type'), 'Ogiltig typ.');
    }

    const cacheKeyInput = { type: actualType, ...extractCacheFields(actualType, data) };
    const cacheKey = makeCacheKey(cacheTenantId, cacheKeyInput);

    try {
      const cached = await getCached(cacheTenantId, cacheKey);
      if (cached && typeof cached === 'object' && 'summary' in cached) {
        return ok({ summary: (cached as any).summary, model: 'gemini', cached: true });
      }
    } catch {
      // Non-blocking cache error
    }

    const summary = await callOpenRouter(SYSTEM_PROMPT, userPrompt);

    try {
      await setCached(cacheTenantId, cacheKey, { summary }, 604800);
    } catch {
      // Non-blocking cache error
    }

    return ok({ summary, model: 'gemini', cached: false });
  } catch (err: any) {
    console.error('AI summarize error:', err);
    try {
      return fail(err, 'Kunde inte generera sammanfattning.');
    } catch {
      return NextResponse.json(
        { success: false, error: 'Kunde inte generera sammanfattning.' },
        { status: 500 }
      );
    }
  }
}

function buildPrompt(type: string, data: any): string | null {
  if (type === 'project') {
    const { name, hours, budgetedHours, status, customerName, timeEntries } = data;
    const entries = timeEntries?.slice(0, 20)
      .map((e: any) => `- ${e.date}: ${e.hours || 0}h ${e.ob_type || ''}`)
      .join('\n') || 'Inga tidsrapporter ännu';

    return `Sammanfatta byggprojektet:\nProjekt: ${name}\nKund: ${customerName || 'Okänd'}\nStatus: ${status || 'Pågående'}\nTimmar: ${hours || 0}h / ${budgetedHours || '?'}h budget\nTidsrapporter:\n${entries}`;
  }

  if (type === 'time-reports') {
    const { totalHours, obHours, totalEntries, entries } = data;
    const recent = entries?.slice(0, 20)
      .map((e: any) => `- ${e.date || '?'}: ${Number(e.hours_total || 0).toFixed(1)}h ${e.ob_type || ''}`)
      .join('\n') || 'Inga rapporter';
    return `Sammanfatta tidsrapporter:\nTotalt: ${totalHours?.toFixed(1) || 0}h\nOB: ${obHours?.toFixed(1) || 0}h\nAntal: ${totalEntries || 0}\n\n${recent}`;
  }

  if (type === 'admin-dashboard') {
    const { employees, activeProjects, unpaidInvoices, totalRevenue } = data;
    return `Sammanfatta företagsöversikt:\nAnställda: ${employees || 0}\nAktiva projekt: ${activeProjects || 0}\nObetalda fakturor: ${unpaidInvoices || 0}\nOmsättning: ${totalRevenue?.toLocaleString('sv-SE') || 0} kr`;
  }

  if (type === 'invoice') {
    const { number, projectName, total, lines } = data;
    const lineItems = lines?.slice(0, 30)
      .map((l: any) => `${l.description || 'Arbete'}: ${l.hours || 0}h @ ${l.rate || 0}kr = ${l.amount || 0}kr`)
      .join('\n') || 'Inga poster';
    return `Sammanfatta faktura:\nNr: ${number}\nProjekt: ${projectName || 'Okänt'}\nTotalt: ${total || 0}kr\n${lineItems}`;
  }

  return null;
}

function extractCacheFields(type: string, data: any): Record<string, any> {
  if (type === 'project') return { name: data.name, hours: data.hours, budgetedHours: data.budgetedHours, status: data.status };
  if (type === 'time-reports') return { totalHours: data.totalHours, obHours: data.obHours, totalEntries: data.totalEntries };
  if (type === 'admin-dashboard') return { employees: data.employees, activeProjects: data.activeProjects, unpaidInvoices: data.unpaidInvoices, totalRevenue: data.totalRevenue };
  if (type === 'invoice') return { number: data.number, total: data.total, lineCount: data.lines?.length || 0 };
  return {};
}
