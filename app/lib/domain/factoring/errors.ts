// app/lib/domain/factoring/errors.ts
import { AppError } from '@/lib/utils/errors';

export class FactoringError extends AppError {
  readonly statusCode = 400;
  readonly code = 'FACTORING_ERROR';
}

export class InvoiceNotEligibleError extends FactoringError {
  readonly code = 'INVOICE_NOT_ELIGIBLE';

  constructor(reason: string, context?: Record<string, unknown>) {
    super(`Invoice not eligible for factoring: ${reason}`, context);
  }
}

export class FactoringProviderError extends AppError {
  readonly statusCode = 502;
  readonly code = 'FACTORING_PROVIDER_ERROR';

  constructor(provider: string, message: string, context?: Record<string, unknown>) {
    super(`${provider} error: ${message}`, context);
  }
}

export class DuplicateApplicationError extends FactoringError {
  readonly code = 'DUPLICATE_APPLICATION';

  constructor(invoiceId: string) {
    super(`Factoring application already exists for invoice: ${invoiceId}`, {
      invoiceId,
    });
  }
}

