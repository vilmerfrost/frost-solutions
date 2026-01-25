// app/lib/domain/rot/validation.ts
import { InvalidPersonnummerError } from './errors';
import { encryptPnr, decryptPnr } from '@/lib/crypto/pnr';

/**
 * Validate Swedish personnummer (YYYYMMDD-XXXX)
 * Uses Luhn algorithm
 */
export function validatePersonnummer(personnummer: string): boolean {
 // Remove any spaces or dashes
 const cleaned = personnummer.replace(/[\s-]/g, '');
 
 // Must be 10 or 12 digits
 if (!/^\d{10}$|^\d{12}$/.test(cleaned)) {
  return false;
 }
 
 // Use last 10 digits for validation
 const digits = cleaned.slice(-10);
 
 // Luhn algorithm
 let sum = 0;
 for (let i = 0; i < 9; i++) {
  let digit = parseInt(digits[i], 10);
  
  // Double every other digit
  if (i % 2 === 0) {
   digit *= 2;
   if (digit > 9) {
    digit -= 9;
   }
  }
  
  sum += digit;
 }
 
 const checksum = parseInt(digits[9], 10);
 return (sum + checksum) % 10 === 0;
}

/**
 * Encrypt personnummer for storage (GDPR compliance)
 * Uses pgcrypto encryption via Supabase RPC with AES-256
 */
export async function encryptPersonnummer(personnummer: string): Promise<string> {
 // SECURITY: Use proper AES-256 encryption from crypto module
 return encryptPnr(personnummer);
}

/**
 * Decrypt personnummer for usage
 * Uses pgcrypto decryption via Supabase RPC
 */
export async function decryptPersonnummer(encrypted: string): Promise<string> {
 // SECURITY: Use proper AES-256 decryption from crypto module
 return decryptPnr(encrypted);
}

/**
 * Mask personnummer for logging (GDPR)
 */
export function maskPersonnummer(personnummer: string): string {
 if (!personnummer || personnummer.length < 4) {
  return '***-****';
 }
 
 const cleaned = personnummer.replace(/[\s-]/g, '');
 const lastFour = cleaned.slice(-4);
 
 return `******-${lastFour}`;
}

/**
 * Validate property designation (Fastighetsbeteckning)
 */
export function validatePropertyDesignation(designation: string): boolean {
 // Basic validation - should match format like "CITY DISTRICT:NUMBER"
 return /^[A-ZÅÄÖ\s]+\s+\d+:\d+$/i.test(designation);
}

