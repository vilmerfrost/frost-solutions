// app/api/ai/summarize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ok, fail } from '@/lib/ai/common';
import { getTenantId } from '@/lib/serverTenant';
import { makeCacheKey, getCached, setCached } from '@/lib/ai/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI-summarization using Hugging Face Inference API (free tier)
 * Summarizes projects, invoices, or other data
 * IMPROVED: Added caching and tenant support
 */
export async function POST(req: NextRequest) {
  // Wrap entire handler in try-catch to prevent any crashes
  try {
    const tenantId = await getTenantId();
    // Use tenant ID if available, otherwise use a default (for backward compatibility)
    const cacheTenantId = tenantId || '00000000-0000-0000-0000-000000000000';

    const { resourceType, resourceId, type, data } = await req.json();
    
    // Support both old format (type, data) and new format (resourceType, resourceId, data)
    const actualType = resourceType || type;
    const actualData = data;

    if (!actualType || !actualData) {
      return fail(new Error('type eller data saknas'), 'Ogiltig begäran.');
    }

    // Build prompt based on type
    let prompt = '';
    let cacheKeyInput: any = { type: actualType };

    if (actualType === 'project') {
      const { name, hours, budgetedHours, status, customerName, timeEntries } = actualData;
      const entries =
        timeEntries?.slice(0, 20).map((e: any) => `- ${e.date}: ${e.hours || 0}h ${e.ob_type || ''}`).join('\n') ||
        'Inga tidsrapporter ännu';

      prompt =
        `Sammanfatta följande byggprojekt på svenska, max 150 ord:\n\n` +
        `Projektnamn: ${name}\n` +
        `Kund: ${customerName || 'Okänd'}\n` +
        `Status: ${status || 'Pågående'}\n` +
        `Timmar använda: ${hours || 0}h\n` +
        `Budgeterade timmar: ${budgetedHours || 'Ej angivet'}h\n` +
        `Tidsrapporter:\n${entries}\n\n` +
        `Ge en kort sammanfattning av projektets status, framsteg och eventuella problem.`;

      cacheKeyInput = { ...cacheKeyInput, name, hours, budgetedHours, status };
    } else if (actualType === 'time-reports') {
      const { entries, totalHours, obHours, totalEntries } = actualData;
      const recentEntries = entries?.slice(0, 20).map((e: any) => 
        `- ${e.date || 'Okänt datum'}: ${Number(e.hours_total || 0).toFixed(1)}h ${e.ob_type || 'vanlig tid'}`
      ).join('\n') || 'Inga rapporter';

      prompt =
        `Sammanfatta följande tidsrapporter på svenska, max 150 ord:\n\n` +
        `Totalt rapporterade timmar: ${totalHours?.toFixed(1) || 0}h\n` +
        `Varav OB-timmar: ${obHours?.toFixed(1) || 0}h\n` +
        `Antal rapporter: ${totalEntries || 0}\n` +
        `Senaste rapporter:\n${recentEntries}\n\n` +
        `Ge en kort sammanfattning av arbetstiden, trender och eventuella mönster.`;

      cacheKeyInput = { ...cacheKeyInput, totalHours, obHours, totalEntries };
    } else if (actualType === 'admin-dashboard') {
      const { employees, activeProjects, unpaidInvoices, totalRevenue, projects, invoices } = actualData;
      
      prompt =
        `Sammanfatta följande företagsöversikt på svenska, max 150 ord:\n\n` +
        `Anställda: ${employees || 0}\n` +
        `Aktiva projekt: ${activeProjects || 0}\n` +
        `Obetalda fakturor: ${unpaidInvoices || 0}\n` +
        `Total omsättning: ${totalRevenue?.toLocaleString('sv-SE') || 0} kr\n\n` +
        `Ge en kort sammanfattning av företagets status, framsteg och eventuella åtgärder som behövs.`;

      cacheKeyInput = { ...cacheKeyInput, employees, activeProjects, unpaidInvoices, totalRevenue };
    } else if (actualType === 'invoice') {
      const { number, projectName, total, lines } = actualData;
      const lineItems =
        lines?.slice(0, 30)
          .map((l: any) => `${l.description || 'Arbete'}: ${l.hours || 0}h @ ${l.rate || 0}kr = ${l.amount || 0}kr`)
          .join('\n') || 'Inga poster';

      prompt =
        `Sammanfatta följande faktura på svenska, max 100 ord:\n\n` +
        `Fakturanr: ${number}\n` +
        `Projekt: ${projectName || 'Okänt'}\n` +
        `Totalt: ${total || 0}kr\n` +
        `Poster:\n${lineItems}\n\n` +
        `Ge en kort beskrivning av vad fakturan innehåller.`;

      cacheKeyInput = { ...cacheKeyInput, number, total, lineCount: lines?.length || 0 };
    } else {
      return fail(new Error('Invalid type'), 'Ogiltig typ. Använd "project" eller "invoice".');
    }

    // Check cache first
    const cacheKey = makeCacheKey(cacheTenantId, cacheKeyInput);
    try {
      const cached = await getCached(cacheTenantId, cacheKey);
      if (cached && typeof cached === 'object' && 'summary' in cached) {
        const cachedData = cached as { summary: string };
        return ok({ summary: cachedData.summary, model: 'huggingface', cached: true });
      }
    } catch (cacheError) {
      // Cache errors shouldn't block the request - just log and continue
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache read error (non-blocking):', cacheError);
      }
    }

    // Use Hugging Face Inference API (free, no auth needed for many models)
    // Using a lightweight summarization model
    let summary: string | null = null;
    let modelUsed = 'template';

    try {
      const response = await fetch('https://api-inference.huggingface.co/models/SEBIS/legal_t5_small_sv_summarization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 200,
            min_length: 50,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (!result.error) {
          summary =
            (Array.isArray(result) && result[0]?.summary_text
              ? result[0].summary_text
              : result.summary_text) || null;
          modelUsed = 'huggingface';
        }
      }
    } catch (error) {
      // Fall through to template
      console.error('Hugging Face API error:', error);
    }

    // Fallback to template if AI failed
    if (!summary) {
      summary = generateFallbackSummary(actualType, actualData);
      modelUsed = 'template';
    }

    // Cache the result (TTL: 7 days = 604800 seconds)
    // Don't block on cache write errors
    try {
      await setCached(cacheTenantId, cacheKey, { summary }, 604800);
    } catch (cacheError) {
      // Cache write errors shouldn't block the response
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache write error (non-blocking):', cacheError);
      }
    }

    return ok({
      summary,
      model: modelUsed,
      cached: false,
    });
  } catch (err: any) {
    // Catch ALL errors - never let this crash the site
    console.error('AI summarize error:', err);
    
    // Always return a safe response, even if everything fails
    try {
      return fail(err, 'Kunde inte generera sammanfattning.');
    } catch (failError) {
      // Even fail() might throw - return a basic error response
      return NextResponse.json(
        {
          success: false,
          error: 'Kunde inte generera sammanfattning. Försök igen senare.',
        },
        { status: 500 }
      );
    }
  }
}

function generateFallbackSummary(type: string, data: any): string {
  if (type === 'project') {
    const { name, hours, budgetedHours, status } = data;
    const progress = budgetedHours ? Math.round((hours / budgetedHours) * 100) : null;

    let summary = `${name} är ${status || 'pågående'}. `;
    summary += hours ? `${hours} timmar har rapporterats. ` : 'Inga timmar rapporterade ännu. ';
    if (progress !== null) {
      summary += `Projektet är ${progress}% klart enligt budget. `;
    }
    summary += 'Fortsätt följa upp med kunden regelbundet.';
    return summary;
  } else if (type === 'invoice') {
    const { number, total, lines } = data;
    const totalHours = lines?.reduce((sum: number, l: any) => sum + (l.hours || 0), 0) || 0;

    let summary = `Faktura ${number} omfattar ${lines?.length || 0} poster. `;
    summary += totalHours > 0 ? `Totalt ${totalHours} timmar. ` : '';
    summary += `Totalt belopp: ${total || 0}kr. `;
    summary += 'Fakturan är redo att skickas till kunden.';
    return summary;
  } else if (type === 'time-reports') {
    const { totalHours, obHours, totalEntries } = data;
    let summary = `Totalt ${totalHours?.toFixed(1) || 0} timmar rapporterade. `;
    if (obHours && obHours > 0) {
      summary += `Varav ${obHours.toFixed(1)}h OB-timmar. `;
    }
    summary += `${totalEntries || 0} tidsrapporter totalt. `;
    summary += 'Fortsätt rapportera tid regelbundet för korrekt fakturering.';
    return summary;
  } else if (type === 'admin-dashboard') {
    const { employees, activeProjects, unpaidInvoices, totalRevenue } = data;
    let summary = `Företaget har ${employees || 0} anställda och ${activeProjects || 0} aktiva projekt. `;
    if (unpaidInvoices && unpaidInvoices > 0) {
      summary += `${unpaidInvoices} obetalda fakturor kvarstår. `;
    }
    summary += `Total omsättning: ${totalRevenue?.toLocaleString('sv-SE') || 0} kr. `;
    summary += 'Fortsätt följa upp projekt och fakturor regelbundet.';
    return summary;
  }

  return 'Sammanfattning kunde inte genereras.';
}
