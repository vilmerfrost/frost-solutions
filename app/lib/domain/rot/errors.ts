// app/lib/domain/rot/errors.ts
import { AppError } from '@/lib/utils/errors';

export class RotError extends AppError {
 readonly statusCode: number = 400;
 readonly code: string = 'ROT_ERROR';
}

export class InvalidPersonnummerError extends RotError {
 override readonly code: string = 'INVALID_PERSONNUMMER';

 constructor(personnummer?: string) {
  super('Ogiltigt personnummer', {
   personnummer: personnummer ? '***-****' : undefined, // Never log actual personnummer
  });
 }
}

export class IneligibleWorkTypeError extends RotError {
 override readonly code: string = 'INELIGIBLE_WORK_TYPE';

 constructor(workType: string, reason: string) {
  super(`Arbetstyp ${workType} är inte berättigad: ${reason}`, {
   workType,
   reason,
  });
 }
}

export class MaxDeductionExceededError extends RotError {
 override readonly code: string = 'MAX_DEDUCTION_EXCEEDED';

 constructor(requestedAmount: number, maxAmount: number) {
  super(`Begärt avdrag (${requestedAmount} kr) överstiger maxgräns (${maxAmount} kr)`, {
   requestedAmount,
   maxAmount,
  });
 }
}

export class XmlGenerationError extends RotError {
 override readonly statusCode: number = 500;
 override readonly code: string = 'XML_GENERATION_ERROR';

 constructor(message: string, context?: Record<string, unknown>) {
  super(`XML-generering misslyckades: ${message}`, context);
 }
}

