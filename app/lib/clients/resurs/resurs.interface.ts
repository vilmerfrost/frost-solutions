// app/lib/clients/resurs/resurs.interface.ts
export interface IResursClient {
  /**
   * Submit factoring application to Resurs
   */
  submitApplication(request: ResursApplicationRequest): Promise<ResursApplicationResponse>;

  /**
   * Get application status from Resurs
   */
  getApplicationStatus(applicationId: string): Promise<ResursStatusResponse>;

  /**
   * Cancel pending application
   */
  cancelApplication(applicationId: string): Promise<void>;
}

export interface ResursApplicationRequest {
  invoice_number: string;
  invoice_amount: number;
  invoice_date: string;
  due_date: string;
  customer_org_number: string;
  customer_name: string;
  line_items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
  }>;
}

export interface ResursApplicationResponse {
  application_id: string;
  status: 'pending' | 'approved' | 'rejected';
  fee_percentage: number;
  fee_amount: number;
  net_amount: number;
}

export interface ResursStatusResponse {
  application_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'funded';
  funded_at?: string;
  rejected_reason?: string;
}

