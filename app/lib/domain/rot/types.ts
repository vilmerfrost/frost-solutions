// app/lib/domain/rot/types.ts
export type RotWorkType =
  | 'rot_repair'           // Reparation
  | 'rot_maintenance'      // Underhåll
  | 'rot_improvement'      // Ombyggnad/tillbyggnad
  | 'rut_cleaning'         // RUT - Städning
  | 'rut_gardening';       // RUT - Trädgårdsarbete

export type RotApplicationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'submitted_to_skatteverket'
  | 'processed'
  | 'rejected';

export interface RotApplication {
  id: string;
  tenant_id: string;
  invoice_id: string;
  customer_id: string;
  
  // Work details
  work_type: RotWorkType;
  property_designation: string; // Fastighetsbeteckning
  apartment_number?: string;
  
  // Financial
  total_amount: number;
  labor_cost: number;
  material_cost: number;
  deductible_amount: number;
  deduction_percentage: number;
  
  // Customer information (encrypted)
  customer_personnummer: string; // Encrypted
  customer_name: string;
  customer_address: string;
  customer_postal_code: string;
  customer_city: string;
  
  // Dates
  work_start_date: Date;
  work_end_date: Date;
  invoice_date: Date;
  
  // Status
  status: RotApplicationStatus;
  
  // Skatteverket
  skatteverket_reference?: string;
  xml_file_path?: string;
  submitted_at?: Date;
  processed_at?: Date;
  
  // Metadata
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface CreateRotApplicationInput {
  invoice_id: string;
  customer_id: string;
  work_type: RotWorkType;
  property_designation: string;
  apartment_number?: string;
  labor_cost: number;
  material_cost: number;
  work_start_date: string;
  work_end_date: string;
  invoice_date: string;
  customer_personnummer: string;
  customer_name: string;
  customer_address: string;
  customer_postal_code: string;
  customer_city: string;
}

export interface CalculateRotDeductionInput {
  work_type: RotWorkType;
  labor_cost: number;
  material_cost: number;
}

export interface RotDeductionResult {
  deductible_amount: number;
  deduction_percentage: number;
  max_deduction: number;
  eligible: boolean;
  reason?: string;
}

export interface RotXmlExport {
  application_id: string;
  xml_content: string;
  file_path: string;
}

