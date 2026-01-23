// app/lib/crypto/pnr.ts
// Personnummer encryption for GDPR compliance
// Uses Supabase RPC with pgcrypto AES-256 encryption

import { createAdminClient } from '@/utils/supabase/admin';

// Encryption key from environment variable (must be 32 bytes for AES-256)
const ENCRYPTION_KEY = process.env.PNR_ENCRYPTION_KEY;

/**
 * Encrypt personnummer for storage (GDPR compliance)
 * Uses Supabase RPC function with pgcrypto AES-256-CBC encryption
 * 
 * @param pnr - Swedish personnummer (YYYYMMDD-XXXX format)
 * @returns Base64-encoded encrypted string
 * @throws Error if encryption fails or key is missing
 */
export async function encryptPnr(pnr: string): Promise<string> {
 if (!pnr || pnr.trim() === '') {
  throw new Error('Personnummer cannot be empty');
 }

 // Validate personnummer format (basic check)
 const cleanPnr = pnr.replace(/[-\s]/g, '');
 if (!/^\d{12}$/.test(cleanPnr) && !/^\d{10}$/.test(cleanPnr)) {
  throw new Error('Invalid personnummer format');
 }

 if (!ENCRYPTION_KEY) {
  throw new Error(
   'PNR_ENCRYPTION_KEY environment variable is not set. ' +
   'Generate a 32-character key and add it to your .env.local file.'
  );
 }

 const admin = createAdminClient();
 
 const { data, error } = await admin.rpc('app_encrypt_text', { 
  p_plaintext: cleanPnr,
  p_key: ENCRYPTION_KEY
 });
 
 if (error) {
  throw new Error(`Encryption failed: ${error.message}`);
 }
 
 if (!data) {
  throw new Error('Encryption returned no data');
 }
 
 return data as string;
}

/**
 * Decrypt personnummer for usage
 * Uses Supabase RPC function with pgcrypto AES-256-CBC decryption
 * 
 * @param encrypted - Base64-encoded encrypted personnummer
 * @returns Decrypted personnummer (12 digits, no dashes)
 * @throws Error if decryption fails or key is missing
 */
export async function decryptPnr(encrypted: string): Promise<string> {
 if (!encrypted || encrypted.trim() === '') {
  throw new Error('Encrypted value cannot be empty');
 }

 if (!ENCRYPTION_KEY) {
  throw new Error(
   'PNR_ENCRYPTION_KEY environment variable is not set. ' +
   'Generate a 32-character key and add it to your .env.local file.'
  );
 }

 const admin = createAdminClient();
 
 const { data, error } = await admin.rpc('app_decrypt_text', { 
  p_ciphertext: encrypted,
  p_key: ENCRYPTION_KEY
 });
 
 if (error) {
  throw new Error(`Decryption failed: ${error.message}`);
 }
 
 if (!data) {
  throw new Error('Decryption returned no data');
 }
 
 return data as string;
}

/**
 * Format personnummer for display (masked)
 * Shows only last 4 digits for privacy
 * 
 * @param pnr - Full personnummer (12 digits)
 * @returns Masked personnummer (e.g., "********-1234")
 */
export function maskPnr(pnr: string): string {
 const clean = pnr.replace(/[-\s]/g, '');
 if (clean.length < 4) return '****';
 return `********-${clean.slice(-4)}`;
}

/**
 * Format decrypted personnummer for Skatteverket submission
 * Formats as YYYYMMDD-XXXX
 * 
 * @param pnr - Personnummer (10 or 12 digits)
 * @returns Formatted personnummer with dash
 */
export function formatPnrForSubmission(pnr: string): string {
 const clean = pnr.replace(/[-\s]/g, '');
 
 // If 10 digits, assume 19XX or 20XX century
 if (clean.length === 10) {
  const twoDigitYear = parseInt(clean.substring(0, 2), 10);
  const century = twoDigitYear > 30 ? '19' : '20'; // Adjust threshold as needed
  return `${century}${clean.substring(0, 6)}-${clean.substring(6)}`;
 }
 
 // If 12 digits, just add dash
 if (clean.length === 12) {
  return `${clean.substring(0, 8)}-${clean.substring(8)}`;
 }
 
 throw new Error('Invalid personnummer length');
}

