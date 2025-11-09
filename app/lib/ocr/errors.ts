// app/lib/ocr/errors.ts

/**
 * Custom error classes for OCR processing
 * Based on GPT-5 implementation
 */

export class OCRProcessingError extends Error {
  constructor(
    message: string,
    public code: string = 'OCR_PROCESSING_ERROR',
    public ctx?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OCRProcessingError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class StorageError extends Error {
  constructor(
    message: string,
    public ctx?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'StorageError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public issues?: unknown
  ) {
    super(message);
    this.name = 'ValidationError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = 'Rate limit exceeded',
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class IdempotencyError extends Error {
  constructor(
    message: string = 'Idempotency key conflict',
    public existingResponse?: unknown
  ) {
    super(message);
    this.name = 'IdempotencyError';
    Error.captureStackTrace(this, this.constructor);
  }
}

