// app/utils/mocks/rot.ts
/**
 * Mock data generators for ROT
 * Based on Mistral AI recommendations
 */
import type { RotDeduction } from '@/types/rot';

export function generateMockRotApplication(): RotDeduction {
  const statuses: RotDeduction['status'][] = ['draft', 'queued', 'submitted', 'accepted', 'rejected'];
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const laborAmount = Math.floor(Math.random() * 40000) + 5000; // 5k-45k
  const materialAmount = Math.floor(Math.random() * 20000) + 2000; // 2k-22k
  const travelAmount = Math.floor(Math.random() * 5000); // 0-5k
  const percentage = Math.random() > 0.5 ? 30 : 50;
  const deductionAmount = Math.round(laborAmount * (percentage / 100));

  return {
    id: `rot-application-${Math.random().toString(36).substr(2, 9)}`,
    tenant_id: `tenant-${Math.random().toString(36).substr(2, 9)}`,
    invoice_id: `invoice-${Math.random().toString(36).substr(2, 9)}`,
    rot_percentage: percentage,
    labor_amount_sek: laborAmount,
    material_amount_sek: materialAmount,
    travel_amount_sek: travelAmount,
    deduction_amount_sek: deductionAmount,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

