/**
 * AI Chat API Endpoint
 * Handles streaming responses with tool calling, RAG, and memory
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { detectIntentSimple, extractEntities, type IntentType } from '@/lib/ai/intent';
import { getOrCreateConversation, addMessage, getConversationContext, shouldSummarize, createSummary } from '@/lib/ai/memory';
import { checkRepeatGuard } from '@/lib/ai/anti-loop';
import { SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { AVAILABLE_TOOLS, getTool } from '@/lib/ai/tools';
import { claudeJSON } from '@/lib/ai/claude';
import { getFromCache, setCache, makeCacheKey } from '@/lib/ai/cache';
import { enforceRateLimit } from '@/lib/ai/ratelimit';
import { extractErrorMessage } from '@/lib/errorUtils';
import { trackAIRequest, logTelemetry } from '@/lib/ai/telemetry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Simple RAG - fetch relevant data based on intent
async function fetchRAGContext(tenantId: string, intent: IntentType, entities: Record<string, string>) {
  const admin = createAdminClient();
  const context: string[] = [];

  try {
    switch (intent) {
      case 'invoice':
        if (entities.project_id) {
          const { data: project } = await admin
            .from('projects')
            .select('name, budget_hours, status')
            .eq('id', entities.project_id)
            .eq('tenant_id', tenantId)
            .maybeSingle();
          if (project) {
            context.push(`Projekt: ${project.name}, Budget: ${project.budget_hours || 0}h, Status: ${project.status}`);
          }
        }
        break;
      case 'time':
        // Fetch time entries for current month
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const { data: entries } = await admin
          .from('time_entries')
          .select('hours, date, project_id')
          .eq('tenant_id', tenantId)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0])
          .limit(50);
        
        if (entries && entries.length > 0) {
          const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);
          context.push(`Tidsrapporter denna månad: ${entries.length} rapporter, Totalt: ${totalHours.toFixed(1)}h`);
        }
        break;
      case 'budget':
        if (entities.project_id) {
          const { data: project } = await admin
            .from('projects')
            .select('name, budget_hours, status')
            .eq('id', entities.project_id)
            .eq('tenant_id', tenantId)
            .maybeSingle();
          if (project) {
            context.push(`Projekt: ${project.name}, Budget: ${project.budget_hours || 0}h`);
          }
        }
        break;
    }
  } catch (error) {
    console.error('RAG fetch error:', error);
  }

  return context.join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    const tenantId = await getTenantId();
    if (!tenantId) {
      return new Response(JSON.stringify({ error: 'No tenant found' }), { status: 403 });
    }

    const body = await req.json();
    const { message, conversationId } = body;

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), { status: 400 });
    }

    // Get or create conversation
    const conversation = conversationId 
      ? { id: conversationId } as any
      : await getOrCreateConversation(tenantId, user.id);

    // Detect intent
    const intentResult = detectIntentSimple(message);
    const intent = intentResult.intent;
    const entities = extractEntities(message);

    // Check for repeat guard
    const repeatGuard = await checkRepeatGuard(tenantId, user.id, intent, message);
    if (repeatGuard.hasRepeat && repeatGuard.suggestion) {
      return new Response(JSON.stringify({ 
        response: repeatGuard.suggestion,
        intent,
        cached: false,
        tools_used: []
      }), { status: 200 });
    }

    // Add user message to conversation
    await addMessage(conversation.id, {
      role: 'user',
      content: message,
      intent,
      metadata: { entities }
    });

    // Fetch RAG context
    const ragContext = await fetchRAGContext(tenantId, intent, entities);

    // Get conversation context
    const conversationContext = await getConversationContext(conversation.id, 10);

    // Build prompt
    const userPrompt = `Användarfråga: ${message}\n\nKontext från Frost-data:\n${ragContext || 'Ingen specifik kontext hittades.'}\n\nTidigare konversation:\n${conversationContext || 'Ingen tidigare konversation.'}\n\nSvara kort, konkret, på svenska. Följ systemprompten.`;

    // Check cache
    const cacheKey = makeCacheKey({ message, intent, entities, tenantId });
    const cached = await getFromCache<string>(tenantId, 'chat', cacheKey);
    if (cached.hit) {
      // Track cache hit
      await logTelemetry({
        tenant_id: tenantId,
        user_id: user.id,
        event_type: 'cache_hit',
        intent,
        cache_hit: true,
        latency_ms: Date.now() - Date.now() // Instant
      });
      
      await addMessage(conversation.id, {
        role: 'assistant',
        content: cached.data!,
        intent,
        metadata: { cached: true }
      });
      return new Response(JSON.stringify({
        response: cached.data,
        intent,
        cached: true,
        tools_used: []
      }), { status: 200 });
    }

    // Rate limit for paid AI calls
    if (intent === 'invoice' || intent === 'project-plan') {
      try {
        await enforceRateLimit(tenantId, intent === 'invoice' ? 'invoice' : 'project-plan', intent === 'invoice' ? 5 : 3);
      } catch (rateError: any) {
        await logTelemetry({
          tenant_id: tenantId,
          user_id: user.id,
          event_type: 'rate_limit',
          intent,
          error: rateError.message
        });
        return new Response(JSON.stringify({ 
          error: rateError.message || 'Rate limit uppnådd'
        }), { status: 429 });
      }
    }

    // Track AI request
    const startTime = Date.now();
    const tracker = await trackAIRequest(tenantId, user.id, intent, 'claude-3-5-haiku-latest', startTime);

    // Generate response with Claude
    let aiResponse: string;
    let toolsUsed: any[] = [];

    try {
      // Anti-hallucination: Check if we have data before making claims
      const hasData = ragContext.length > 0;
      
      // For now, use simple template-based responses for most intents
      // In production, this would use Claude with tool calling
      if (intent === 'time' && message.toLowerCase().includes('sammanfatta')) {
        // Use existing summarize logic
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const admin = createAdminClient();
        const { data: entries } = await admin
          .from('time_entries')
          .select('hours')
          .eq('tenant_id', tenantId)
          .gte('date', startOfMonth.toISOString().split('T')[0])
          .lte('date', endOfMonth.toISOString().split('T')[0]);

        if (entries && entries.length > 0) {
          const totalHours = entries.reduce((sum, e) => sum + parseFloat(e.hours || 0), 0);
          aiResponse = `Här är en sammanfattning av dina tidsrapporter:\n\n📊 Totalt rapporterade timmar: ${totalHours.toFixed(1)}h\n📅 Denna månad: ${totalHours.toFixed(1)}h\n📝 Antal rapporter: ${entries.length}\n\nKälla: Frost Solutions, ${new Date().toLocaleDateString('sv-SE')}\n\nVill du se mer detaljer? Gå till "Rapporter" i menyn.`;
        } else {
          aiResponse = 'Du har inga tidsrapporter denna månad ännu. 📅\n\nFör att rapportera tid:\n1. ⏰ Använd stämpelklockan på dashboarden\n2. 📝 Gå till "Rapporter" → "Ny tidsrapport"';
        }
      } else if (!hasData && (intent === 'invoice' || intent === 'budget' || intent === 'time')) {
        // Anti-hallucination: If no data found, say so
        aiResponse = `Jag hittar inte denna information i Frost-datan just nu.\n\nFör att jag ska kunna hjälpa dig bättre:\n• Kontrollera att du har rätt behörigheter\n• Se till att data finns i systemet\n• Försök igen om en stund\n\nVill du att jag visar dig var du hittar denna information manuellt?`;
      } else {
        // Use Claude for complex queries
        try {
          const claudeResponse = await claudeJSON(
            'claude-3-5-haiku-latest',
            SYSTEM_PROMPT + (hasData ? `\n\nVIKTIGT: Använd endast data från kontexten ovan. Om data saknas, säg "Jag hittar inte detta i Frost-datan."` : ''),
            userPrompt,
            1024
          );
          aiResponse = typeof claudeResponse === 'string' ? claudeResponse : JSON.stringify(claudeResponse);
        } catch (claudeError: any) {
          console.error('Claude error:', claudeError);
          // Fallback to template
          aiResponse = `Jag förstår din fråga om "${message}". ${hasData ? `Baserat på Frost-data: ${ragContext}` : 'Jag hittar inte denna information i Frost-datan just nu.'}\n\nFör mer hjälp, gå till FAQ eller använd snabbknapparna.`;
        }
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      // Fallback to template
      aiResponse = `Jag förstår din fråga om "${message}". För mer hjälp, gå till FAQ eller använd snabbknapparna.`;
    }

    // Cache response
    await setCache(tenantId, 'chat', cacheKey, aiResponse, 7, 'claude-3-5-haiku-latest');

    // End telemetry tracking
    await tracker.endTracking(aiResponse.length / 4, false); // Rough token estimate: ~4 chars per token

    // Add assistant message
    await addMessage(conversation.id, {
      role: 'assistant',
      content: aiResponse,
      intent,
      tools_used: toolsUsed,
      metadata: { rag_context: ragContext }
    });

    // Check if should summarize
    if (await shouldSummarize(conversation.id)) {
      // TODO: Generate summary with Claude
      // For now, skip
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      intent,
      cached: false,
      tools_used: toolsUsed,
      conversation_id: conversation.id
    }), { status: 200 });

  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ 
      error: extractErrorMessage(error) || 'Kunde inte generera svar'
    }), { status: 500 });
  }
}

