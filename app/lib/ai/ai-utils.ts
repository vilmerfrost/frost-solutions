// app/lib/ai/ai-utils.ts
import * as crypto from 'crypto';

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
/**
 * @function checkRateLimit
 * En mock-funktion för att kontrollera API-användning.
 * @param userId - ID för användaren.
 * @param limitPerMinute - Max antal anrop per minut.
 * @returns {Result<true, string>} - True om OK, annars felmeddelande.
 */
export function checkRateLimit(userId: string, limitPerMinute: number): Result<true, string> {
 // I en riktig implementation skulle denna funktion anropa en Redis-server
 // eller en Supabase Edge Function för att hantera globala räknare.
 
 // Mock: Anta att användaren 'user-over-limit' har förbrukat sin kvot
 if (userId === 'user-over-limit') {
  return { ok: false, error: `Rate limit (${limitPerMinute}/minut) exceeded for user.` };
 }
 
 return { ok: true, value: true };
}

