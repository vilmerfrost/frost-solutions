// app/types/rot.ts
export type RotStatus = 'draft' | 'queued' | 'submitted' | 'accepted' | 'rejected';

export interface RotDeduction {
  id: string;
  tenant_id: string;
  invoice_id: string;
  rot_percentage: 30 | 50;
  labor_amount_sek: number;
  material_amount_sek: number;
  travel_amount_sek: number;
  deduction_amount_sek: number;
  status: RotStatus;
  xml_payload?: string; // stored XML
  created_at: string;
  updated_at: string;
}

export interface RotDeductionHistory {
  id: string;
  tenant_id: string;
  rot_id: string;
  action: string;
  meta?: unknown;
  created_by?: string;
  created_at: string;
}

