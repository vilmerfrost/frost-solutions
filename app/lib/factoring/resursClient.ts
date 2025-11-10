// app/lib/factoring/resursClient.ts
import crypto from 'crypto';
import { FactoringError } from './factoring-utils';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export function hmacSignature(secret: string, payload: string, algo: 'sha256' = 'sha256'): string {
  return crypto.createHmac(algo, Buffer.from(secret, 'utf8')).update(payload, 'utf8').digest('hex');
}

export interface ResursConfig {
  baseUrl: string; // från research, ex: https://merchant.api.resurs.com/v2
  merchantId: string;
  keyId: string; // API Key ID (public)
  keySecret: string; // decrypted secret
}

export async function resursRequest<T>(
  cfg: ResursConfig,
  path: string,
  method: HttpMethod,
  body?: unknown,
  idempotencyKey?: string
): Promise<T> {
  const url = `${cfg.baseUrl}${path}`;
  const payload = body ? JSON.stringify(body) : '';
  const signature = hmacSignature(cfg.keySecret, payload);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Merchant-Id': cfg.merchantId,
    'X-Key-Id': cfg.keyId,
    'X-Signature': signature,
    'Accept': 'application/json',
  };
  
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey;
  }
  
  const res = await fetch(url, { method, headers, body: payload || undefined });
  const text = await res.text();
  const json = text ? JSON.parse(text) : undefined;
  
  if (!res.ok) {
    const ctx = json?.error || text || res.statusText;
    throw new Error(`Resurs API error ${res.status}: ${ctx}`);
  }
  
  return json as T;
}

