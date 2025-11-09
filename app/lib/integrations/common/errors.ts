// app/lib/integrations/common/errors.ts

export type APIErrorPayload = unknown;

export class APIError extends Error {
  readonly status: number;
  readonly payload?: APIErrorPayload;
  readonly url?: string;
  readonly method?: string;

  constructor(
    message: string,
    status: number,
    payload?: APIErrorPayload,
    ctx?: { url?: string; method?: string }
  ) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.payload = payload;
    this.url = ctx?.url;
    this.method = ctx?.method;
  }
}

export class APIErrorHandler {
  static isRetryable(status: number): boolean {
    // 429 rate limit, 408/409 sometimes transient, 5xx transient
    return (
      status === 429 ||
      status === 408 ||
      status === 409 ||
      (status >= 500 && status <= 599)
    );
  }

  static isAuthError(status: number): boolean {
    return status === 401 || status === 403;
  }

  static handleError(err: unknown, context: string): never {
    if (err instanceof APIError) {
      throw new APIError(
        `[${context}] ${err.message}`,
        err.status,
        err.payload,
        { url: err.url, method: err.method }
      );
    }

    if (err instanceof Error) {
      throw new Error(`[${context}] ${err.message}`);
    }

    throw new Error(`[${context}] Unknown error`);
  }
}

