// app/lib/domain/rot/errors.ts
import { AppError } from '@/lib/utils/errors';

export class RotError extends AppError {
 readonly statusCode = 400;
 readonly code = 'ROT_ERROR';
}

export class InvalidPersonnummerError extends RotError {
 readonly code = 'INVALID_PERSONNUMMER';

 constructor(personnummer?: string) {
  super('Ogiltigt personnummer', {
   personnummer: personnummer ? '***-****' : undefined, // Never log actual personnummer
  });
 }
}

export class IneligibleWorkTypeError extends RotError {
 readonly code = 'INELIGIBLE_WORK_TYPE';

 constructor(workType: string, reason: string) {
  super(`Arbetstyp ${workType} är inte berättigad: ${reason}`, {
   workType,
   reason,
  });
 }
}

export class MaxDeductionExceededError extends RotError {
 readonly code = 'MAX_DEDUCTION_EXCEEDED';

 constructor(requestedAmount: number, maxAmount: number) {
  super(`Begärt avdrag (${requestedAmount} kr) överstiger maxgräns (${maxAmount} kr)`, {
   requestedAmount,
   maxAmount,
  });
 }
}

export class XmlGenerationError extends RotError {
 readonly statusCode = 500;
 readonly code = 'XML_GENERATION_ERROR';

 constructor(message: string, context?: Record<string, unknown>) {
  super(`XML-generering misslyckades: ${message}`, context);
 }
}

