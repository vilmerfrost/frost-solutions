// app/lib/domain/factoring/types.ts
export type FactoringStatus =
 | 'draft'
 | 'pending_approval'
 | 'submitted'
 | 'under_review'
 | 'approved'
 | 'rejected'
 | 'funded'
 | 'cancelled';

export type FactoringProvider = 'resurs' | 'svea' | 'collector';

export interface FactoringApplication {
 id: string;
 tenant_id: string;
 invoice_id: string;
 provider: FactoringProvider;
 status: FactoringStatus;
 
 // Amounts
 invoice_amount: number;
 factoring_amount: number;
 fee_amount: number;
 net_amount: number;
 
 // External references
 external_application_id?: string;
 external_status?: string;
 
 // Metadata
 submitted_at?: Date;
 approved_at?: Date;
 funded_at?: Date;
 rejected_reason?: string;
 
 created_at: Date;
 updated_at: Date;
}

export interface CreateFactoringApplicationInput {
 invoice_id: string;
 provider: FactoringProvider;
 invoice_amount: number;
}

export interface SubmitFactoringApplicationInput {
 application_id: string;
}

export interface FactoringWebhookPayload {
 application_id: string;
 external_status: string;
 status: FactoringStatus;
 funded_at?: string;
 rejected_reason?: string;
}

