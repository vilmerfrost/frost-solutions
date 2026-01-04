// app/lib/security/webhook-security.ts
import crypto from 'crypto';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('WebhookSecurity');

/**
 * Verify webhook signature using timing-safe comparison
 * Prevents timing attacks on signature validation
 */
export function verifyWebhookSignature(
 payload: string,
 receivedSignature: string,
 secretKey: string
): boolean {
 const expectedSignature = crypto
  .createHmac('sha256', secretKey)
  .update(payload)
  .digest('hex');

 // Use timing-safe comparison to prevent timing attacks
 try {
  return crypto.timingSafeEqual(
   Buffer.from(receivedSignature),
   Buffer.from(expectedSignature)
  );
 } catch {
  return false;
 }
}

/**
 * Verify Resurs webhook with proper security
 */
export function verifyResursWebhook(
 payload: string,
 signature: string,
 secret: string
): boolean {
 if (!signature || !secret) {
  logger.warn('Missing signature or secret for webhook verification');
  return false;
 }

 return verifyWebhookSignature(payload, signature, secret);
}

/**
 * Check if event has already been processed (idempotency)
 */
export async function isEventProcessed(
 eventId: string,
 db: any
): Promise<boolean> {
 if (!eventId) return false;

 const { data } = await db
  .schema('app')
  .from('factoring_webhooks')
  .select('id')
  .eq('event_id', eventId)
  .maybeSingle();

 return !!data;
}

/**
 * Log security event for monitoring
 */
export async function logSecurityEvent(
 eventType: string,
 metadata: Record<string, unknown>,
 db: any
): Promise<void> {
 try {
  await db.schema('app').from('security_events').insert({
   event_type: eventType,
   metadata,
   created_at: new Date().toISOString(),
  });
 } catch (error) {
  logger.error('Failed to log security event', error);
 }
}

