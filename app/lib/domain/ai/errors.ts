// app/lib/domain/ai/errors.ts
import { AppError } from '@/lib/utils/errors';

export class AiError extends AppError {
 readonly statusCode: number = 500;
 readonly code: string = 'AI_ERROR';
}

export class AiProviderError extends AiError {
 override readonly code: string = 'AI_PROVIDER_ERROR';

 constructor(provider: string, message: string, context?: Record<string, unknown>) {
  super(`${provider} error: ${message}`, context);
 }
}

export class TokenLimitExceededError extends AiError {
 override readonly statusCode: number = 400;
 override readonly code: string = 'TOKEN_LIMIT_EXCEEDED';

 constructor(requested: number, limit: number) {
  super(`Token limit exceeded: ${requested} > ${limit}`, { requested, limit });
 }
}

export class ContextTooLargeError extends AiError {
 override readonly statusCode: number = 400;
 override readonly code: string = 'CONTEXT_TOO_LARGE';

 constructor(size: number, limit: number) {
  super(`Context size ${size} exceeds limit ${limit}`, { size, limit });
 }
}

