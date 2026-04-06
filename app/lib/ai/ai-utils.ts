// app/lib/ai/ai-utils.ts
import * as crypto from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';

// --- Type Definitions ---
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type LLMRole = 'system' | 'user' | 'assistant';

export interface LLMMessage {
 role: LLMRole;
 content: string;
}

/** Generisk typ för AI-modell-konfiguration. */
export interface AIModelConfig {
 maxTokens: number;
 modelName: string;
 contextRatio: number; // Hur stor del av maxTokens som är reserverad för input/context
}

// --- Prompt Building Utilities ---
/**
 * @function buildPrompt
 * Bygger en komplett prompt genom att injicera dynamisk kontext.
 * @param systemInstruction - Huvuddirektivet för modellen.
 * @param userContext - Objekt med nyckel/värde-par som ska injiceras i kontexten.
 * @param userQuestion - Den aktuella frågan från användaren.
 * @returns {LLMMessage[]} - Array av meddelanden redo för API-anrop.
 * @example
 * buildPrompt('Act as a senior TypeScript developer.', { user_id: '123' }, 'How do I use generics?');
 */
export function buildPrompt(
 systemInstruction: string,
 userContext: Record<string, any>,
 userQuestion: string
): LLMMessage[] {
 // Konvertera kontext till en sträng för injektion i systemmeddelandet
 const contextString = Object.entries(userContext)
  .map(([key, value]) => `[${key}]: ${JSON.stringify(value)}`)
  .join('\n');
 
 const fullSystemInstruction = `${systemInstruction}\n\n--- CONTEXT ---\n${contextString}`;
 
 return [
  { role: 'system', content: fullSystemInstruction },
  { role: 'user', content: userQuestion },
 ];
}

// --- Token Counting Helper (Simplified) ---
/**
 * @function countSimpleTokens
 * En förenklad token-räknare baserad på antalet ord och specialtecken.
 * (OBS: I produktion bör man använda modellspecifika tokenizers som Tiktoken)
 * @param messages - Array av LLM-meddelanden.
 * @returns Uppskattat antal tokens.
 */
export function countSimpleTokens(messages: LLMMessage[]): number {
 return messages.reduce((total, message) => {
  // Uppskatta 1 token per 4 tecken + 2 tokens per meddelande för overhead
  const charCount = message.content.length;
  return total + Math.ceil(charCount / 4) + 2;
 }, 0);
}

// --- Cache Key Generation ---
/**
 * @function generateCacheKey
 * Skapar en unik och konsekvent cache-nyckel baserat på prompt-innehåll.
 * @param messages - Array av LLM-meddelanden.
 * @param modelName - Namnet på AI-modellen som används.
 * @returns {string} - SHA-256 hash av meddelandeinnehållet och modellen.
 */
export function generateCacheKey(messages: LLMMessage[], modelName: string): string {
 const contentString = messages.map(m => `${m.role}:${m.content}`).join('|');
 const fullInput = `${modelName}|${contentString}`;
 
 // Returnera en SHA256-hash för kort, unikt och säkert ID
 return crypto.createHash('sha256').update(fullInput).digest('hex');
}

// --- Rate Limiting Helper ---

/** Default rate limit: 100 AI requests per hour per tenant */
const DEFAULT_RATE_LIMIT_PER_HOUR = 100;

/**
 * @function checkRateLimit
 * Checks AI usage rate limit for a tenant by counting recent requests
 * in the `ai_usage_log` table.
 *
 * @param tenantId - The tenant ID to check (NOT a user ID).
 * @param limitPerHour - Max requests per hour (default: 100).
 * @param feature - Optional feature name to scope the limit to.
 * @returns {Result<true, string>} - True if within limit, error message otherwise.
 *
 * --- MIGRATION REQUIRED ---
 * This function queries the `ai_usage_log` table. If it doesn't exist yet,
 * create it with:
 *
 *   CREATE TABLE ai_usage_log (
 *     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
 *     tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 *     user_id UUID,
 *     feature TEXT NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT now() NOT NULL
 *   );
 *   CREATE INDEX idx_ai_usage_log_tenant_created ON ai_usage_log (tenant_id, created_at DESC);
 *   ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;
 *   -- Admin-only access (service role bypasses RLS by default)
 */
export async function checkRateLimit(
 tenantId: string,
 limitPerHour: number = DEFAULT_RATE_LIMIT_PER_HOUR,
 feature?: string
): Promise<Result<true, string>> {
 try {
  const admin = createAdminClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  let query = admin
   .from('ai_usage_log')
   .select('id', { count: 'exact', head: true })
   .eq('tenant_id', tenantId)
   .gte('created_at', oneHourAgo);

  if (feature) {
   query = query.eq('feature', feature);
  }

  const { count, error } = await query;

  if (error) {
   // If the table doesn't exist yet, log a warning and allow the request
   // so the app doesn't break before migration is applied.
   console.warn('[RateLimit] Query failed (table may not exist yet):', error.message);
   return { ok: true, value: true };
  }

  const currentCount = count ?? 0;

  if (currentCount >= limitPerHour) {
   return {
    ok: false,
    error: `Hastighetsgräns överskriden: ${currentCount}/${limitPerHour} förfrågningar per timme.`,
   };
  }

  return { ok: true, value: true };
 } catch (err: any) {
  // Fail open — don't block users if rate limiting infra has issues
  console.error('[RateLimit] Unexpected error:', err.message);
  return { ok: true, value: true };
 }
}

/**
 * @function logAIUsage
 * Records an AI usage event in the `ai_usage_log` table.
 * Call this after a successful AI request to track usage for rate limiting.
 *
 * @param tenantId - The tenant ID.
 * @param feature - The AI feature used (e.g. 'supplier_invoice_ocr').
 * @param userId - Optional user ID who triggered the request.
 */
export async function logAIUsage(
 tenantId: string,
 feature: string,
 userId?: string
): Promise<void> {
 try {
  const admin = createAdminClient();

  const { error } = await admin.from('ai_usage_log').insert({
   tenant_id: tenantId,
   user_id: userId ?? null,
   feature,
  });

  if (error) {
   console.warn('[RateLimit] Failed to log AI usage:', error.message);
  }
 } catch (err: any) {
  // Non-blocking — don't let logging failures affect the AI call
  console.error('[RateLimit] Unexpected error logging usage:', err.message);
 }
}

