// app/lib/clients/resurs/resurs-client.ts
import type {
 IResursClient,
 ResursApplicationRequest,
 ResursApplicationResponse,
 ResursStatusResponse,
} from './resurs.interface';
import { withRetry } from '@/lib/utils/retry';
import { createLogger } from '@/lib/utils/logger';
import { FactoringProviderError } from '@/lib/domain/factoring/errors';

const logger = createLogger('ResursClient');

export class ResursClient implements IResursClient {
 private readonly baseUrl: string;
 private readonly apiKey: string;

 constructor() {
  this.baseUrl = process.env.RESURS_API_URL || 'https://merchant.api.resurs.com/v2';
  this.apiKey = process.env.RESURS_API_KEY || '';
  
  if (!this.apiKey) {
   throw new Error('Resurs configuration missing');
  }
 }

 /**
  * Submit factoring application
  */
 async submitApplication(
  request: ResursApplicationRequest
 ): Promise<ResursApplicationResponse> {
  logger.info('Submitting application to Resurs', {
   invoiceNumber: request.invoice_number,
   amount: request.invoice_amount,
  });

  return withRetry(
   async () => {
    const response = await fetch(`${this.baseUrl}/applications`, {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'X-Idempotency-Key': `${request.invoice_number}-${Date.now()}`,
     },
     body: JSON.stringify(request),
    });

    if (!response.ok) {
     const error = await response.json().catch(() => ({}));
     throw new FactoringProviderError(
      'Resurs',
      error.message || 'Application submission failed',
      { status: response.status, error }
     );
    }

    const data = await response.json();
    logger.info('Application submitted successfully', {
     applicationId: data.application_id,
    });
    return data;
   },
   {
    maxAttempts: 3,
    initialDelay: 1000,
    retryableErrors: (error) => {
     // Retry on network errors and 5xx, but not 4xx
     if (error instanceof FactoringProviderError) {
      const status = error.context?.status as number;
      return status >= 500;
     }
     return true;
    },
   }
  );
 }

 /**
  * Get application status
  */
 async getApplicationStatus(applicationId: string): Promise<ResursStatusResponse> {
  logger.info('Fetching application status', { applicationId });

  return withRetry(async () => {
   const response = await fetch(`${this.baseUrl}/applications/${applicationId}`, {
    method: 'GET',
    headers: {
     'Authorization': `Bearer ${this.apiKey}`,
    },
   });

   if (!response.ok) {
    throw new FactoringProviderError(
     'Resurs',
     'Failed to fetch application status',
     { applicationId, status: response.status }
    );
   }

   return response.json();
  });
 }

 /**
  * Cancel application
  */
 async cancelApplication(applicationId: string): Promise<void> {
  logger.info('Cancelling application', { applicationId });

  await fetch(`${this.baseUrl}/applications/${applicationId}/cancel`, {
   method: 'POST',
   headers: {
    'Authorization': `Bearer ${this.apiKey}`,
   },
  });

  logger.info('Application cancelled', { applicationId });
 }
}

