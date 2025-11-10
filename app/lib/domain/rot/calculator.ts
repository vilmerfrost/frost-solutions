// app/lib/domain/rot/calculator.ts
import type { RotWorkType, CalculateRotDeductionInput, RotDeductionResult } from './types';
import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('RotCalculator');

/**
 * ROT/RUT Calculation Constants (2025)
 * Source: Skatteverket
 */
const ROT_RUT_CONSTANTS = {
  // Deduction percentages
  rot_deduction_percentage: 30, // 30% of labor cost
  rut_deduction_percentage: 50, // 50% of labor cost
  
  // Maximum deductions per person per year
  rot_max_deduction: 50000, // SEK
  rut_max_deduction: 75000, // SEK
  
  // Material cost limits
  rot_material_cost_limit: 0.5, // Material can be max 50% of total
};

/**
 * Calculate ROT/RUT deduction
 * Business logic for tax deduction calculation
 */
export function calculateRotDeduction(input: CalculateRotDeductionInput): RotDeductionResult {
  logger.info('Calculating ROT/RUT deduction', {
    workType: input.work_type,
    laborCost: input.labor_cost,
    materialCost: input.material_cost,
  });

  // STEP 1: Determine if ROT or RUT
  const isRut = input.work_type.startsWith('rut_');
  const deductionPercentage = isRut
    ? ROT_RUT_CONSTANTS.rut_deduction_percentage
    : ROT_RUT_CONSTANTS.rot_deduction_percentage;
  
  const maxDeduction = isRut
    ? ROT_RUT_CONSTANTS.rut_max_deduction
    : ROT_RUT_CONSTANTS.rot_max_deduction;

  // STEP 2: Validate material cost ratio (only for ROT)
  if (!isRut) {
    const totalCost = input.labor_cost + input.material_cost;
    const materialRatio = input.material_cost / totalCost;
    
    if (materialRatio > ROT_RUT_CONSTANTS.rot_material_cost_limit) {
      logger.warn('Material cost exceeds limit', {
        materialCost: input.material_cost,
        totalCost,
        ratio: materialRatio,
      });
      
      return {
        deductible_amount: 0,
        deduction_percentage: 0,
        max_deduction: maxDeduction,
        eligible: false,
        reason: `Materialkostnad (${Math.round(materialRatio * 100)}%) överstiger gränsen på 50%`,
      };
    }
  }

  // STEP 3: Calculate deductible amount
  // Only labor cost is deductible
  const calculatedDeduction = (input.labor_cost * deductionPercentage) / 100;
  
  // Cap at maximum deduction
  const deductibleAmount = Math.min(calculatedDeduction, maxDeduction);

  logger.info('Deduction calculated', {
    laborCost: input.labor_cost,
    deductionPercentage,
    calculatedDeduction,
    deductibleAmount,
    maxDeduction,
  });

  return {
    deductible_amount: Math.round(deductibleAmount),
    deduction_percentage: deductionPercentage,
    max_deduction: maxDeduction,
    eligible: true,
  };
}

/**
 * Validate work type eligibility
 */
export function validateWorkTypeEligibility(workType: RotWorkType): {
  eligible: boolean;
  reason?: string;
} {
  // All defined work types are eligible
  // Add custom business rules here if needed
  
  const eligibleTypes: RotWorkType[] = [
    'rot_repair',
    'rot_maintenance',
    'rot_improvement',
    'rut_cleaning',
    'rut_gardening',
  ];

  if (!eligibleTypes.includes(workType)) {
    return {
      eligible: false,
      reason: 'Arbetstypen är inte godkänd för ROT/RUT-avdrag',
    };
  }

  return { eligible: true };
}

