// app/lib/factoring/factoring-utils.ts
import * as crypto from 'crypto';

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
    throw new Error('Invalid input: Amount must be positive and feeRate non-negative.');
  }
  
  const creditRiskFee = amount * feeRate;
  const payoutAmount = amount - creditRiskFee - fixedFee;
  
  return {
    invoiceAmount: amount,
    feeRate: feeRate,
    creditRiskFee: parseFloat(creditRiskFee.toFixed(2)),
    payoutAmount: parseFloat(payoutAmount.toFixed(2)),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Exempel: 30 dagar
  };
}

