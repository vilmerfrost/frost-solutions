// app/lib/crypto/pnr-mask.ts
/**
 * GDPR-compliant personnummer masking utilities
 * Based on Kimi K2 security recommendations
 */

/**
 * Mask personnummer for display (shows only last 4 digits)
 * Example: 199001011234 -> ********1234
 */
export function maskPersonnummer(pnr: string): string {
 if (!pnr || pnr.length < 4) return '****';
 const cleaned = pnr.replace(/\D/g, '');
 if (cleaned.length < 4) return '****';
 return '*'.repeat(Math.max(0, cleaned.length - 4)) + cleaned.slice(-4);
}

/**
 * Format personnummer for input (YYYYMMDD-XXXX)
 */
export function formatPersonnummer(pnr: string): string {
 const cleaned = pnr.replace(/\D/g, '');
 if (cleaned.length <= 8) return cleaned;
 if (cleaned.length <= 12) {
  return `${cleaned.slice(0, 8)}-${cleaned.slice(8)}`;
 }
 return cleaned.slice(0, 12);
}

/**
 * Validate Swedish personnummer format
 */
export function isValidPersonnummerFormat(pnr: string): boolean {
 const cleaned = pnr.replace(/\D/g, '');
 return cleaned.length === 10 || cleaned.length === 12;
}

