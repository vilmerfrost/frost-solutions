// app/lib/security/gdpr-encryption.ts
import crypto from 'crypto';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('GDPREncryption');

/**
 * Encrypt sensitive data (personnummer) for GDPR compliance
 * Uses AES-256-GCM encryption
 */
export function encryptSensitiveData(
 plaintext: string,
 encryptionKey: string,
 additionalData?: string
): string {
 const algorithm = 'aes-256-gcm';
 const key = crypto.scryptSync(encryptionKey, 'salt', 32);
 const iv = crypto.randomBytes(16);

 const cipher = crypto.createCipheriv(algorithm, key, iv);

 if (additionalData) {
  cipher.setAAD(Buffer.from(additionalData));
 }

 let encrypted = cipher.update(plaintext, 'utf8', 'hex');
 encrypted += cipher.final('hex');

 const authTag = cipher.getAuthTag();

 // Return: iv:authTag:encrypted (all hex)
 return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptSensitiveData(
 encryptedData: string,
 encryptionKey: string,
 additionalData?: string
): string {
 const algorithm = 'aes-256-gcm';
 const key = crypto.scryptSync(encryptionKey, 'salt', 32);

 const parts = encryptedData.split(':');
 if (parts.length !== 3) {
  throw new Error('Invalid encrypted data format');
 }

 const iv = Buffer.from(parts[0], 'hex');
 const authTag = Buffer.from(parts[1], 'hex');
 const encrypted = parts[2];

 const decipher = crypto.createDecipheriv(algorithm, key, iv);
 decipher.setAuthTag(authTag);

 if (additionalData) {
  decipher.setAAD(Buffer.from(additionalData));
 }

 let decrypted = decipher.update(encrypted, 'hex', 'utf8');
 decrypted += decipher.final('utf8');

 return decrypted;
}

/**
 * Mask personnummer for logging (GDPR compliance)
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
 * Hash personnummer for non-sensitive lookups
 */
export function hashPersonnummer(personnummer: string): string {
 return crypto.createHash('sha256').update(personnummer).digest('hex');
}

