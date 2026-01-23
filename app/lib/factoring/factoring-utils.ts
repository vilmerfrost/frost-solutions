// app/lib/factoring/factoring-utils.ts
import * as crypto from 'crypto'
import { createAdminClient } from '@/utils/supabase/admin'

// Encryption key from environment variable
const FACTORING_ENCRYPTION_KEY = process.env.FACTORING_ENCRYPTION_KEY

// --- Type Definitions ---

/** Representerar resultatet av en ren funktion: antingen data (Ok) eller ett fel (Err). */
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Gemensam typ för Factoring API-fel. */
export interface FactoringError {
 code: string;
 message: string;
 httpStatus?: number;
}

/** Definition av ett factoring-erbjudande. */
export interface FactoringOffer {
 invoiceAmount: number; // Ursprungligt fakturabelopp
 feeRate: number; // T.ex. 0.03 för 3%
 creditRiskFee: number;
 payoutAmount: number; // Belopp att betala ut
 dueDate: string;
}

// --- Status Mapping ---
const FACTOR_STATUS_MAP = {
 PENDING: 'Väntar på Godkännande',
 ACCEPTED: 'Godkänd - Väntar på utbetalning',
 PAID: 'Utbetald',
 REJECTED: 'Nekad av partner',
 ERROR: 'Fel vid bearbetning',
} as const;

/**
 * @function mapFactoringStatus
 * Mappar en extern API-statuskod till en användarvänlig sträng.
 * @param externalStatus - Statuskoden från factoring-partnern.
 * @returns Den interna statussträngen.
 */
export function mapFactoringStatus(externalStatus: keyof typeof FACTOR_STATUS_MAP): string {
 return FACTOR_STATUS_MAP[externalStatus] || `Okänd status: ${externalStatus}`;
}

// --- Signature Generation (Integration Helper) ---
/**
 * @function generateRequestSignature
 * Genererar en HMAC-SHA256-signatur för API-anrop.
 * @param payload - JSON-objektet som ska skickas (som sträng).
 * @param secretKey - Den delade hemliga nyckeln.
 * @returns Den hexadecimala HMAC-signaturen.
 * @example
 * const sig = generateRequestSignature('{"amount": 100}', 'my-secret');
 */
export function generateRequestSignature(payload: string, secretKey: string): string {
 return crypto.createHmac('sha256', secretKey).update(payload).digest('hex');
}

// --- Webhook Validation Utility ---
/**
 * @function validateWebhookSignature
 * Validerar en inkommande webhook-signatur.
 * @param payload - Den råa (raw) webhook-bodyn.
 * @param receivedSignature - Signaturen som skickades i request-headern.
 * @param secretKey - Den delade hemliga nyckeln.
 * @returns {Result<true, FactoringError>} - True vid matchning, annars fel.
 * @example
 * if (validateWebhookSignature(rawBody, headerSig, secret).ok) { ... }
 */
export function validateWebhookSignature(
 payload: string,
 receivedSignature: string,
 secretKey: string
): Result<true, FactoringError> {
 const expectedSignature = generateRequestSignature(payload, secretKey);
 
 // Använd timing-attack resistent jämförelse
 if (crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature))) {
  return { ok: true, value: true };
 }
 
 return { 
  ok: false, 
  error: { 
   code: 'AUTH_FAILED', 
   message: 'Webhook signature validation failed. Received signature does not match expected hash.' 
  } 
 };
}

// --- Factoring Offer Calculation ---
/**
 * @function calculateFactoringOffer
 * Beräknar nyckeltal för factoring-erbjudandet.
 * @param amount - Fakturabelopp.
 * @param feeRate - Factoring-avgift (som decimal, t.ex. 0.02).
 * @param fixedFee - Eventuell fast transaktionsavgift.
 * @returns {FactoringOffer} - Det beräknade erbjudandet.
 */
export function calculateFactoringOffer(
 amount: number,
 feeRate: number,
 fixedFee: number = 0
): FactoringOffer {
 if (amount <= 0 || feeRate < 0) {
  throw new Error('Invalid input: Amount must be positive and feeRate non-negative.')
 }
 
 const creditRiskFee = amount * feeRate
 const payoutAmount = amount - creditRiskFee - fixedFee
 
 return {
  invoiceAmount: amount,
  feeRate: feeRate,
  creditRiskFee: parseFloat(creditRiskFee.toFixed(2)),
  payoutAmount: parseFloat(payoutAmount.toFixed(2)),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Exempel: 30 dagar
 }
}

// --- Secret Decryption for Tenant ---

/**
 * @function decryptSecretForTenant
 * Decrypts an encrypted API secret using the Supabase RPC function.
 * Falls back to environment variable if decryption fails.
 * 
 * @param encryptedSecret - The encrypted secret stored in the database
 * @param tenantId - The tenant ID (for audit logging)
 * @returns The decrypted secret string
 * @throws Error if decryption fails and no fallback is available
 */
export async function decryptSecretForTenant(
 encryptedSecret: string,
 tenantId: string
): Promise<string> {
 // If no encryption key is configured, we can't decrypt
 if (!FACTORING_ENCRYPTION_KEY) {
  // Check for environment variable fallback
  const envSecret = process.env.RESURS_API_SECRET
  if (envSecret) {
   return envSecret
  }
  throw new Error(
   'FACTORING_ENCRYPTION_KEY environment variable is not set. ' +
   'Generate a 32-character key and add it to your .env.local file.'
  )
 }

 // If the secret doesn't look encrypted (base64), return as-is (legacy support)
 if (!encryptedSecret || encryptedSecret.length < 20) {
  const envSecret = process.env.RESURS_API_SECRET
  if (envSecret) {
   return envSecret
  }
  throw new Error('Invalid encrypted secret and no fallback available')
 }

 try {
  const admin = createAdminClient()
  
  const { data, error } = await admin.rpc('app_decrypt_text', {
   p_ciphertext: encryptedSecret,
   p_key: FACTORING_ENCRYPTION_KEY
  })

  if (error) {
   throw new Error(`Decryption failed: ${error.message}`)
  }

  if (!data) {
   throw new Error('Decryption returned no data')
  }

  return data as string
 } catch (decryptError: any) {
  // Log the error but try environment fallback
  console.error(`Failed to decrypt secret for tenant ${tenantId}:`, decryptError.message)
  
  const envSecret = process.env.RESURS_API_SECRET
  if (envSecret) {
   console.warn('Using RESURS_API_SECRET environment variable as fallback')
   return envSecret
  }
  
  throw new Error(`Failed to decrypt secret: ${decryptError.message}`)
 }
}

/**
 * @function encryptSecretForTenant
 * Encrypts an API secret for storage in the database.
 * 
 * @param plainSecret - The plain text secret to encrypt
 * @param tenantId - The tenant ID (for audit logging)
 * @returns The encrypted secret string (base64)
 * @throws Error if encryption fails
 */
export async function encryptSecretForTenant(
 plainSecret: string,
 tenantId: string
): Promise<string> {
 if (!FACTORING_ENCRYPTION_KEY) {
  throw new Error(
   'FACTORING_ENCRYPTION_KEY environment variable is not set. ' +
   'Generate a 32-character key and add it to your .env.local file.'
  )
 }

 if (!plainSecret || plainSecret.trim() === '') {
  throw new Error('Secret cannot be empty')
 }

 try {
  const admin = createAdminClient()
  
  const { data, error } = await admin.rpc('app_encrypt_text', {
   p_plaintext: plainSecret,
   p_key: FACTORING_ENCRYPTION_KEY
  })

  if (error) {
   throw new Error(`Encryption failed: ${error.message}`)
  }

  if (!data) {
   throw new Error('Encryption returned no data')
  }

  return data as string
 } catch (encryptError: any) {
  throw new Error(`Failed to encrypt secret for tenant ${tenantId}: ${encryptError.message}`)
 }
}

