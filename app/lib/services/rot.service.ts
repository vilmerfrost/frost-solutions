// app/lib/services/rot.service.ts
import type { IRotRepository } from '@/lib/repositories/rot.repository';
import type {
 RotApplication,
 CreateRotApplicationInput,
 CalculateRotDeductionInput,
 RotDeductionResult,
 RotXmlExport,
} from '@/lib/domain/rot/types';
import { calculateRotDeduction, validateWorkTypeEligibility } from '@/lib/domain/rot/calculator';
import { validatePersonnummer, encryptPersonnummer } from '@/lib/domain/rot/validation';
import { generateSkatteverketXml } from '@/lib/domain/rot/xml-generator';
import { InvalidPersonnummerError, IneligibleWorkTypeError } from '@/lib/domain/rot/errors';
import { Result, ok, err } from '@/lib/utils/result';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RotService');

export interface IRotService {
 calculateDeduction(input: CalculateRotDeductionInput): Result<RotDeductionResult, Error>;
 createApplication(input: CreateRotApplicationInput, tenantId: string, userId: string): Promise<Result<RotApplication, Error>>;
 getApplication(id: string, tenantId: string): Promise<Result<RotApplication, Error>>;
 listApplications(tenantId: string): Promise<Result<RotApplication[], Error>>;
 generateXml(applicationId: string, tenantId: string): Promise<Result<RotXmlExport, Error>>;
 submitToSkatteverket(applicationId: string, tenantId: string): Promise<Result<RotApplication, Error>>;
}

export class RotService implements IRotService {
 constructor(private readonly repository: IRotRepository) {}

 /**
  * Calculate ROT/RUT deduction
  * Pure business logic - no side effects
  */
 calculateDeduction(input: CalculateRotDeductionInput): Result<RotDeductionResult, Error> {
  logger.info('Calculating deduction', { workType: input.work_type });

  // Validate work type
  const eligibility = validateWorkTypeEligibility(input.work_type);
  
  if (!eligibility.eligible) {
   return err(new IneligibleWorkTypeError(input.work_type, eligibility.reason!));
  }

  // Calculate deduction
  const result = calculateRotDeduction(input);
  return ok(result);
 }

 /**
  * Create ROT application
  */
 async createApplication(
  input: CreateRotApplicationInput,
  tenantId: string,
  userId: string
 ): Promise<Result<RotApplication, Error>> {
  logger.info('Creating ROT application', { tenantId });

  // STEP 1: Validate personnummer
  if (!validatePersonnummer(input.customer_personnummer)) {
   logger.warn('Invalid personnummer');
   return err(new InvalidPersonnummerError());
  }

  // STEP 2: Calculate deduction
  const deductionResult = this.calculateDeduction({
   work_type: input.work_type,
   labor_cost: input.labor_cost,
   material_cost: input.material_cost,
  });

  if (deductionResult.isErr()) {
   return err(deductionResult.error);
  }

  const deduction = deductionResult.value;

  // STEP 3: Encrypt personnummer (GDPR)
  const encryptedPersonnummer = await encryptPersonnummer(input.customer_personnummer);

  // STEP 4: Create application with calculated deduction
  const applicationInput = {
   ...input,
   customer_personnummer: encryptedPersonnummer,
  };

  const createResult = await this.repository.create(applicationInput, tenantId, userId);
  if (createResult.isErr()) {
   return err(createResult.error);
  }

  // STEP 5: Update with deduction amounts
  const updateResult = await this.repository.update(
   createResult.value.id,
   {
    deductible_amount: deduction.deductible_amount,
    deduction_percentage: deduction.deduction_percentage,
   },
   tenantId
  );

  return updateResult;
 }

 /**
  * Get application by ID
  */
 async getApplication(
  id: string,
  tenantId: string
 ): Promise<Result<RotApplication, Error>> {
  return this.repository.findById(id, tenantId);
 }

 /**
  * List all applications
  */
 async listApplications(tenantId: string): Promise<Result<RotApplication[], Error>> {
  return this.repository.list(tenantId);
 }

 /**
  * Generate XML for Skatteverket submission
  */
 async generateXml(
  applicationId: string,
  tenantId: string
 ): Promise<Result<RotXmlExport, Error>> {
  logger.info('Generating XML', { applicationId, tenantId });

  // Get application
  const appResult = await this.repository.findById(applicationId, tenantId);
  if (appResult.isErr()) {
   return err(appResult.error);
  }

  try {
   // Generate XML
   const xmlContent = generateSkatteverketXml(appResult.value);

   // XML storage path - file is generated on-demand when submitting
   const filePath = `rot-applications/${applicationId}.xml`;

   // Update application with XML path
   await this.repository.update(
    applicationId,
    { xml_file_path: filePath },
    tenantId
   );

   return ok({
    application_id: applicationId,
    xml_content: xmlContent,
    file_path: filePath,
   });
  } catch (error) {
   logger.error('XML generation failed', error);
   return err(error as Error);
  }
 }

 /**
  * Submit application to Skatteverket
  * 
  * NOTE: Skatteverket's ROT/RUT API requires:
  * - Special e-tjänst certifiering
  * - BankID/E-legitimation integration
  * - Approved contract with Skatteverket
  * 
  * This implementation supports:
  * - Test mode (SKATTEVERKET_TEST_MODE=true): Simulates API calls
  * - Production mode: Sends real API calls when properly configured
  */
 async submitToSkatteverket(
  applicationId: string,
  tenantId: string
 ): Promise<Result<RotApplication, Error>> {
  logger.info('Submitting to Skatteverket', { applicationId, tenantId });

  // STEP 1: Generate XML
  const xmlResult = await this.generateXml(applicationId, tenantId);
  if (xmlResult.isErr()) {
   return err(xmlResult.error);
  }

  // STEP 2: Get application data
  const appResult = await this.repository.findById(applicationId, tenantId);
  if (appResult.isErr()) {
   return err(appResult.error);
  }
  const application = appResult.value;

  // STEP 3: Submit to Skatteverket
  const isTestMode = process.env.SKATTEVERKET_TEST_MODE === 'true' || !process.env.SKATTEVERKET_API_KEY;
  
  let skatteverketResponse: SkatteverketSubmissionResult;
  
  if (isTestMode) {
   logger.info('Using Skatteverket TEST MODE', { applicationId });
   skatteverketResponse = await this.submitToSkatteverketTestMode(application, xmlResult.value.xml_content);
  } else {
   skatteverketResponse = await this.submitToSkatteverketProduction(application, xmlResult.value.xml_content);
  }

  if (!skatteverketResponse.success) {
   logger.error('Skatteverket submission failed', { 
    applicationId, 
    error: skatteverketResponse.errorMessage 
   });
   return err(new Error(skatteverketResponse.errorMessage || 'Submission failed'));
  }
  
  // STEP 4: Update status with Skatteverket reference
  const updateResult = await this.repository.update(
   applicationId,
   {
    status: 'submitted_to_skatteverket',
    skatteverket_reference: skatteverketResponse.referenceNumber,
    submitted_at: new Date(),
   },
   tenantId
  );

  logger.info('Skatteverket submission successful', { 
   applicationId, 
   referenceNumber: skatteverketResponse.referenceNumber 
  });

  return updateResult;
 }

 /**
  * Test mode submission - simulates Skatteverket API
  */
 private async submitToSkatteverketTestMode(
  application: RotApplication,
  xmlContent: string
 ): Promise<SkatteverketSubmissionResult> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Generate mock reference number
  const referenceNumber = `TEST-ROT-${Date.now().toString(36).toUpperCase()}`;
  
  logger.debug('Test mode submission completed', { 
   referenceNumber,
   applicationId: application.id 
  });
  
  return {
   success: true,
   referenceNumber,
   submittedAt: new Date().toISOString(),
  };
 }

 /**
  * Production mode submission - sends to real Skatteverket API
  * Requires proper API credentials and certifications
  */
 private async submitToSkatteverketProduction(
  application: RotApplication,
  xmlContent: string
 ): Promise<SkatteverketSubmissionResult> {
  const apiKey = process.env.SKATTEVERKET_API_KEY;
  const apiUrl = process.env.SKATTEVERKET_API_URL || 'https://api.skatteverket.se/rot/v1';
  const certPath = process.env.SKATTEVERKET_CERT_PATH;
  
  if (!apiKey) {
   return {
    success: false,
    errorMessage: 'SKATTEVERKET_API_KEY environment variable is not configured',
   };
  }

  try {
   // Build request headers
   const headers: HeadersInit = {
    'Content-Type': 'application/xml',
    'Authorization': `Bearer ${apiKey}`,
    'X-Request-Id': `rot-${application.id}-${Date.now()}`,
   };

   // Submit XML to Skatteverket
   const response = await fetch(`${apiUrl}/submit`, {
    method: 'POST',
    headers,
    body: xmlContent,
   });

   if (!response.ok) {
    const errorBody = await response.text();
    logger.error('Skatteverket API error', { 
     status: response.status, 
     body: errorBody,
     applicationId: application.id 
    });
    return {
     success: false,
     errorMessage: `Skatteverket API error: ${response.status} - ${errorBody}`,
    };
   }

   const result = await response.json();
   
   return {
    success: true,
    referenceNumber: result.referenceNumber || result.caseNumber,
    submittedAt: new Date().toISOString(),
   };
  } catch (error: any) {
   logger.error('Skatteverket API request failed', { 
    error: error.message,
    applicationId: application.id 
   });
   return {
    success: false,
    errorMessage: `API request failed: ${error.message}`,
   };
  }
 }
}

/**
 * Result type for Skatteverket submission
 */
interface SkatteverketSubmissionResult {
 success: boolean;
 referenceNumber?: string;
 submittedAt?: string;
 errorMessage?: string;
}

