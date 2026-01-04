// app/lib/crypto/pnr.ts
import { createAdminClient } from '@/utils/supabase/admin';

/**
 * Encrypt personnummer for storage (GDPR compliance)
 * Uses Supabase RPC function for encryption
 */
export async function encryptPnr(pnr: string): Promise<string> {
 const admin = createAdminClient();
 
 // TODO: Create RPC function app_encrypt_text in Supabase
 // For now, return base64 encoded (NOT SECURE - placeholder)
 // In production, use pgcrypto encryption via RPC
 try {
  const { data, error } = await admin.rpc('app_encrypt_text', { p_plain: pnr });
  if (error) throw error;
  return data as string; // base64 or encrypted
 } catch {
  // Fallback to base64 if RPC doesn't exist (development only)
  return Buffer.from(pnr).toString('base64');
 }
}

/**
 * Decrypt personnummer for usage
 * Uses Supabase RPC function for decryption
 */
export async function decryptPnr(enc: string): Promise<string> {
 const admin = createAdminClient();
 
 // TODO: Create RPC function app_decrypt_text in Supabase
 // For now, decode base64 (NOT SECURE - placeholder)
 try {
  const { data, error } = await admin.rpc('app_decrypt_text', { p_cipher_b64: enc });
  if (error) throw error;
  return data as string;
 } catch {
  // Fallback to base64 decode if RPC doesn't exist (development only)
  return Buffer.from(enc, 'base64').toString('utf-8');
 }
}

