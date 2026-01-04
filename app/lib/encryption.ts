/**
 * AES-256-GCM Encryption for sensitive data (tokens, secrets)
 * 
 * Uses Node.js crypto module for server-side encryption
 * Key must be 32 bytes (256 bits) Base64 encoded
 */

import crypto from 'crypto';

const key = Buffer.from(process.env.ENCRYPTION_KEY_256_BASE64 || '', 'base64');
if (key.length !== 32) {
 // Medvetet hårt fel vid misconfig — säkrare.
 throw new Error('ENCRYPTION_KEY_256_BASE64 måste vara 32 bytes Base64.');
}

export function encryptJSON(obj: unknown): string {
 const iv = crypto.randomBytes(12);
 const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
 const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
 const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
 const tag = cipher.getAuthTag();
 return Buffer.concat([iv, tag, ciphertext]).toString('base64');
}

export function decryptJSON<T = any>(b64: string): T {
 const raw = Buffer.from(b64, 'base64');
 const iv = raw.subarray(0, 12);
 const tag = raw.subarray(12, 28);
 const data = raw.subarray(28);
 const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
 decipher.setAuthTag(tag);
 const plain = Buffer.concat([decipher.update(data), decipher.final()]);
 return JSON.parse(plain.toString('utf8')) as T;
}

// Legacy functions for person number (keep for backward compatibility)
export function encryptPersonNumber(pnr: string): string {
 if (typeof window === 'undefined') {
  return pnr;
 }
 try {
  return btoa(pnr);
 } catch {
  return pnr;
 }
}

export function decryptPersonNumber(encrypted: string): string {
 if (typeof window === 'undefined') {
  return encrypted;
 }
 try {
  return atob(encrypted);
 } catch {
  return encrypted;
 }
}
