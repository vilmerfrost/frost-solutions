// app/lib/utils/errors.ts
/**
 * Base error class for all application errors
 * Extends Error with additional context and logging
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  readonly isOperational: boolean = true;

  constructor(
    message: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Validation errors (400)
 */
export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Authentication errors (401)
 */
export class AuthenticationError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTHENTICATION_ERROR';

  constructor(message: string = 'Authentication required') {
    super(message);
  }
}

/**
 * Authorization errors (403)
 */
export class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly code = 'AUTHORIZATION_ERROR';

  constructor(message: string = 'Insufficient permissions', context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * Not found errors (404)
 */
export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';

  constructor(resource: string, id?: string) {
    super(`${resource} not found${id ? `: ${id}` : ''}`, { resource, id });
  }
}

/**
 * Conflict errors (409)
 */
export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';

  constructor(message: string, context?: Record<string, unknown>) {
    super(message, context);
  }
}

/**
 * External service errors (502)
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  readonly code = 'EXTERNAL_SERVICE_ERROR';

  constructor(
    public readonly service: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(`${service} error: ${message}`, context);
  }
}

/**
 * Rate limit errors (429)
 */
export class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMIT_EXCEEDED';

  constructor(
    public readonly retryAfter: number,
    context?: Record<string, unknown>
  ) {
    super(`Rate limit exceeded. Retry after ${retryAfter} seconds`, {
      ...context,
      retryAfter,
    });
  }
}

/**
 * Internal server errors (500)
 */
export class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;

  constructor(message: string = 'Internal server error', context?: Record<string, unknown>) {
    super(message, context);
  }
}

