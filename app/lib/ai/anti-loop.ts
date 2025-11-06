/**
 * Anti-Loop Detection System
 * Prevents repetitive responses and detects when user is stuck
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import crypto from 'crypto';
import type { IntentType } from './intent';

export interface RepeatGuard {
  hasRepeat: boolean;
  count: number;
  lastIntent?: IntentType;
  suggestion?: string;
}

/**
 * Hash query for duplicate detection
 */
export function hashQuery(query: string): string {
  return crypto.createHash('sha256').update(query.toLowerCase().trim()).digest('hex');
}

/**
 * Check for repeated intents (anti-loop)
 */
export async function checkRepeatGuard(
  tenantId: string,
  userId: string | undefined,
  intent: IntentType,
  query: string
): Promise<RepeatGuard> {
  const admin = createAdminClient();
  const queryHash = hashQuery(query);
  
  // Check last 60 seconds
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data: recentIntents } = await admin
    .from('ai_intent_history')
    .select('intent, query_hash, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId || null)
    .gte('created_at', oneMinuteAgo)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (!recentIntents || recentIntents.length === 0) {
    // Log this intent
    await logIntent(tenantId, userId, intent, queryHash);
    return { hasRepeat: false, count: 0 };
  }
  
  // Count same intent in last minute
  const sameIntentCount = recentIntents.filter(i => i.intent === intent).length;
  const sameQueryCount = recentIntents.filter(i => i.query_hash === queryHash).length;
  
  // If same query repeated > 2 times, suggest action
  if (sameQueryCount >= 2) {
    const suggestion = getActionSuggestion(intent);
    await logIntent(tenantId, userId, intent, queryHash);
    return {
      hasRepeat: true,
      count: sameQueryCount,
      lastIntent: intent,
      suggestion,
    };
  }
  
  // If same intent repeated > 2 times, suggest alternative
  if (sameIntentCount >= 2) {
    const suggestion = getAlternativeSuggestion(intent);
    await logIntent(tenantId, userId, intent, queryHash);
    return {
      hasRepeat: true,
      count: sameIntentCount,
      lastIntent: intent,
      suggestion,
    };
  }
  
  await logIntent(tenantId, userId, intent, queryHash);
  return { hasRepeat: false, count: 0 };
}

/**
 * Log intent to history
 */
async function logIntent(
  tenantId: string,
  userId: string | undefined,
  intent: IntentType,
  queryHash: string
): Promise<void> {
  const admin = createAdminClient();
  
  await admin
    .from('ai_intent_history')
    .insert({
      tenant_id: tenantId,
      user_id: userId || null,
      intent,
      query_hash: queryHash,
    });
}

/**
 * Get action suggestion based on intent
 */
function getActionSuggestion(intent: IntentType): string {
  const suggestions: Record<IntentType, string> = {
    invoice: 'Vill du att jag skapar fakturan nu? Jag kan hjälpa dig med att fylla i alla detaljer.',
    kma: 'Vill du att jag genererar en KMA-checklista för projektet?',
    work_order: 'Vill du att jag skapar arbetsordern nu?',
    time: 'Vill du att jag visar dina tidsrapporter eller hjälper dig att skapa en ny?',
    material: 'Vill du ladda upp en bild så kan jag identifiera materialet?',
    budget: 'Vill du att jag kör en budgetprognos för projektet?',
    general: 'Kan jag hjälpa dig med något specifikt? Prova att fråga om fakturor, projekt eller tidsrapporter.',
  };
  
  return suggestions[intent] || 'Kan jag hjälpa dig med något annat?';
}

/**
 * Get alternative suggestion when intent is repeated
 */
function getAlternativeSuggestion(intent: IntentType): string {
  const alternatives: Record<IntentType, string> = {
    invoice: 'Istället för att fråga om fakturor, vill du att jag skapar en faktura direkt?',
    kma: 'Vill du att jag visar en exempel-checklista eller skapar en för ditt projekt?',
    work_order: 'Vill du att jag listar dina befintliga arbetsorder istället?',
    time: 'Vill du se en sammanfattning av dina tidsrapporter eller skapa en ny?',
    material: 'Vill du att jag visar materiallistan istället, eller ladda upp en bild?',
    budget: 'Vill du se en detaljerad budgetanalys eller bara en snabb översikt?',
    general: 'Låt mig hjälpa dig på ett annat sätt. Vad behöver du just nu?',
  };
  
  return alternatives[intent] || 'Låt mig hjälpa dig på ett annat sätt.';
}

/**
 * Track last 3 intents for context
 */
export interface IntentMemory {
  intents: IntentType[];
  lastOutputType?: string;
}

export function updateIntentMemory(
  memory: IntentMemory,
  newIntent: IntentType,
  outputType?: string
): IntentMemory {
  return {
    intents: [...memory.intents.slice(-2), newIntent], // Keep last 3
    lastOutputType: outputType,
  };
}

