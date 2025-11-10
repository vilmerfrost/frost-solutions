// app/lib/services/factoring.service.ts
import type { IFactoringRepository } from '@/lib/repositories/factoring.repository';
import type { IResursClient } from '@/lib/clients/resurs/resurs.interface';
import type {
  FactoringApplication,
  CreateFactoringApplicationInput,
  SubmitFactoringApplicationInput,
  FactoringWebhookPayload,
} from '@/lib/domain/factoring/types';
import {
  InvoiceNotEligibleError,
  DuplicateApplicationError,
  FactoringProviderError,
} from '@/lib/domain/factoring/errors';
import { NotFoundError, ValidationError } from '@/lib/utils/errors';
import { Result, ok, err } from '@/lib/utils/result';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('FactoringService');

export interface IFactoringService {
  createApplication(input: CreateFactoringApplicationInput, tenantId: string): Promise<Result<FactoringApplication, Error>>;
  submitApplication(input: SubmitFactoringApplicationInput, tenantId: string): Promise<Result<FactoringApplication, Error>>;
  getApplication(id: string, tenantId: string): Promise<Result<FactoringApplication, Error>>;
  listApplications(tenantId: string): Promise<Result<FactoringApplication[], Error>>;
  handleWebhook(payload: FactoringWebhookPayload, tenantId: string): Promise<Result<void, Error>>;
}

export class FactoringService implements IFactoringService {
  constructor(
    private readonly repository: IFactoringRepository,
    private readonly resursClient: IResursClient
  ) {}

  async createApplication(
    input: CreateFactoringApplicationInput,
    tenantId: string
  ): Promise<Result<FactoringApplication, Error>> {
    logger.info('Creating factoring application', { tenantId, invoiceId: input.invoice_id });

    // STEP 1: Check for duplicate application
    const existingResult = await this.repository.findByInvoiceId(input.invoice_id, tenantId);
    if (existingResult.isErr()) {
      return err(existingResult.error);
    }

    if (existingResult.value) {
      logger.warn('Duplicate application detected', {
        invoiceId: input.invoice_id,
        existingId: existingResult.value.id,
      });
      return err(new DuplicateApplicationError(input.invoice_id));
    }

    // STEP 2: Validate invoice eligibility
    const eligibilityResult = await this.validateInvoiceEligibility(input.invoice_id, tenantId);
    if (eligibilityResult.isErr()) {
      return err(eligibilityResult.error);
    }

    if (!eligibilityResult.value.eligible) {
      logger.warn('Invoice not eligible', {
        invoiceId: input.invoice_id,
        reason: eligibilityResult.value.reason,
      });
      return err(
        new InvoiceNotEligibleError(eligibilityResult.value.reason!, {
          invoiceId: input.invoice_id,
        })
      );
    }

    // STEP 3: Create application
    const createResult = await this.repository.create(input, tenantId);
    if (createResult.isErr()) {
      return err(createResult.error);
    }

    logger.info('Application created successfully', {
      applicationId: createResult.value.id,
    });

    return ok(createResult.value);
  }

  async submitApplication(
    input: SubmitFactoringApplicationInput,
    tenantId: string
  ): Promise<Result<FactoringApplication, Error>> {
    logger.info('Submitting application', { applicationId: input.application_id, tenantId });

    // STEP 1: Get application
    const appResult = await this.repository.findById(input.application_id, tenantId);
    if (appResult.isErr()) {
      return err(appResult.error);
    }

    const application = appResult.value;

    // STEP 2: Validate application status
    if (application.status !== 'draft') {
      logger.warn('Application already submitted', {
        applicationId: application.id,
        status: application.status,
      });
      return err(
        new ValidationError('Application already submitted', {
          applicationId: application.id,
          currentStatus: application.status,
        })
      );
    }

    // STEP 3: Update status to submitted
    const updateResult = await this.repository.update(
      application.id,
      {
        status: 'submitted',
        submitted_at: new Date(),
      },
      tenantId
    );

    if (updateResult.isErr()) {
      return err(updateResult.error);
    }

    // STEP 4: Submit to Resurs (async - don't block)
    this.submitToProvider(application, tenantId).catch((error) => {
      logger.error('Failed to submit to provider', error, {
        applicationId: application.id,
      });
    });

    logger.info('Application submitted', { applicationId: application.id });
    return ok(updateResult.value);
  }

  async getApplication(
    id: string,
    tenantId: string
  ): Promise<Result<FactoringApplication, Error>> {
    return this.repository.findById(id, tenantId);
  }

  async listApplications(tenantId: string): Promise<Result<FactoringApplication[], Error>> {
    return this.repository.list(tenantId);
  }

  async handleWebhook(
    payload: FactoringWebhookPayload,
    tenantId: string
  ): Promise<Result<void, Error>> {
    logger.info('Handling webhook', { applicationId: payload.application_id, tenantId });

    // STEP 1: Find application by external ID
    const appResult = await this.repository.findById(payload.application_id, tenantId);
    if (appResult.isErr()) {
      logger.warn('Application not found for webhook', {
        applicationId: payload.application_id,
      });
      return err(appResult.error);
    }

    // STEP 2: Update application with webhook data
    const updateData: Partial<FactoringApplication> = {
      status: payload.status,
      external_status: payload.external_status,
    };

    if (payload.funded_at) {
      updateData.funded_at = new Date(payload.funded_at);
    }

    if (payload.rejected_reason) {
      updateData.rejected_reason = payload.rejected_reason;
    }

    const updateResult = await this.repository.update(
      payload.application_id,
      updateData,
      tenantId
    );

    if (updateResult.isErr()) {
      return err(updateResult.error);
    }

    logger.info('Webhook processed successfully', {
      applicationId: payload.application_id,
      status: payload.status,
    });

    return ok(undefined);
  }

  /**
   * PRIVATE: Submit application to provider
   */
  private async submitToProvider(
    application: FactoringApplication,
    tenantId: string
  ): Promise<void> {
    try {
      logger.info('Submitting to Resurs', { applicationId: application.id });

      // TODO: Fetch invoice and customer data
      const response = await this.resursClient.submitApplication({
        invoice_number: `INV-${application.invoice_id}`,
        invoice_amount: application.invoice_amount,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        customer_org_number: '5566778899',
        customer_name: 'Test Customer AB',
        line_items: [],
      });

      // Update application with provider response
      await this.repository.update(
        application.id,
        {
          external_application_id: response.application_id,
          status: 'under_review',
          fee_amount: response.fee_amount,
          net_amount: response.net_amount,
        },
        tenantId
      );

      logger.info('Submitted to Resurs successfully', {
        applicationId: application.id,
        externalId: response.application_id,
      });
    } catch (error) {
      logger.error('Failed to submit to Resurs', error, {
        applicationId: application.id,
      });

      // Update status to failed
      await this.repository.update(
        application.id,
        {
          status: 'cancelled',
          rejected_reason: error instanceof Error ? error.message : 'Unknown error',
        },
        tenantId
      );
    }
  }

  /**
   * PRIVATE: Validate invoice eligibility
   */
  private async validateInvoiceEligibility(
    invoiceId: string,
    tenantId: string
  ): Promise<Result<{ eligible: boolean; reason?: string }, Error>> {
    // TODO: Implement actual validation logic
    // - Check if invoice is paid
    // - Check invoice amount (min/max)
    // - Check customer credit score
    // - Check invoice age
    logger.debug('Validating invoice eligibility', { invoiceId, tenantId });

    // Placeholder logic
    return ok({ eligible: true });
  }
}

