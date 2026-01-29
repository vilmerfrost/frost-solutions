/**
 * AI Telemetry & Logging
 * Tracks AI usage, costs, and performance metrics
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import crypto from 'crypto';

export interface TelemetryEvent {
 tenant_id: string;
 user_id?: string;
 event_type: 'ai_request' | 'ai_response' | 'tool_call' | 'cache_hit' | 'cache_miss' | 'rate_limit' | 'error';
 intent?: string;
 model?: string;
 tokens_used?: number;
 latency_ms?: number;
 cost_estimate?: number;
 cache_hit?: boolean;
 error?: string;
 metadata?: Record<string, any>;
}

/**
 * Log telemetry event
 */
export async function logTelemetry(event: TelemetryEvent): Promise<void> {
 try {
  const admin = createAdminClient();
  
  // For now, just log to console
  // In production, you'd want a dedicated telemetry table
  console.log('[AI Telemetry]', {
   type: event.event_type,
   intent: event.intent,
   model: event.model,
   tokens: event.tokens_used,
   latency: event.latency_ms,
   cost: event.cost_estimate,
   cached: event.cache_hit,
  });
  
  // Telemetry stored via ai_transactions table - detailed telemetry table planned for future
  //  error TEXT,
  //  metadata JSONB,
  //  created_at TIMESTAMPTZ DEFAULT NOW()
  // );
 } catch (error) {
  console.error('Telemetry logging error:', error);
  // Don't throw - telemetry failures shouldn't break the app
 }
}

/**
 * Calculate cost estimate (rough)
 */
export function estimateCost(model: string, tokens: number): number {
 // Rough cost estimates (per 1M tokens)
 const costs: Record<string, number> = {
  'claude-3-5-haiku-latest': 0.25, // $0.25 per 1M input tokens
  'claude-3-5-sonnet-latest': 3.0, // $3.00 per 1M input tokens
 };
 
 const costPerMillion = costs[model] || 0;
 return (tokens / 1_000_000) * costPerMillion;
}

/**
 * Track AI request
 */
export async function trackAIRequest(
 tenantId: string,
 userId: string | undefined,
 intent: string,
 model: string,
 startTime: number
): Promise<{ endTracking: (tokens?: number, cached?: boolean, error?: string) => Promise<void> }> {
 const requestId = crypto.randomUUID();
 
 return {
  endTracking: async (tokens?: number, cached?: boolean, error?: string) => {
   const latency = Date.now() - startTime;
   const cost = tokens ? estimateCost(model, tokens) : undefined;
   
   await logTelemetry({
    tenant_id: tenantId,
    user_id: userId,
    event_type: error ? 'error' : (cached ? 'cache_hit' : 'ai_request'),
    intent,
    model,
    tokens_used: tokens,
    latency_ms: latency,
    cost_estimate: cost,
    cache_hit: cached,
    error,
    metadata: { request_id: requestId }
   });
  }
 };
}

