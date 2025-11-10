// app/lib/ai/security-guard.ts
/**
 * Client-side prompt injection detection
 * Based on Kimi K2 security recommendations
 */

export const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+all\s+previous\s+instructions/gi,
  /you\s+are\s+now\s+a\s+different\s+ai/gi,
  /disregard\s+system\s+prompt/gi,
  /bypass\s+security/gi,
  /extract\s+all\s+data/gi,
  /show\s+system\s+prompt/gi,
  /jailbreak/gi,
  /DAN\s+mode/gi,
];

export interface PromptInjectionResult {
  isInjection: boolean;
  riskScore: number;
  blockedPatterns: string[];
}

export function detectPromptInjection(
  message: string
): PromptInjectionResult {
  let riskScore = 0;
  const blockedPatterns: string[] = [];

  PROMPT_INJECTION_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(message)) {
      riskScore += index < 2 ? 3 : 1; // Higher weight for critical patterns
      blockedPatterns.push(pattern.source);
    }
  });

  // Check for base64 encoding (obfuscation attempt)
  const base64Pattern = /^[A-Za-z0-9+/=]+$/;
  if (base64Pattern.test(message) && message.length > 50) {
    riskScore += 2;
    blockedPatterns.push('base64_obfuscation');
  }

  // Check for excessive repetition (character stuffing)
  const repeatedChars = message.match(/(.)\1{10,}/);
  if (repeatedChars) {
    riskScore += 1;
    blockedPatterns.push('character_stuffing');
  }

  return {
    isInjection: riskScore >= 3,
    riskScore,
    blockedPatterns,
  };
}

export function sanitizeUserInput(message: string): string {
  // Remove potentially harmful HTML
  const sanitized = message
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '');

  // Limit length
  return sanitized.slice(0, 5000);
}

