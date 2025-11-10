// app/types/factoring.ts
export type FactoringProvider = 'resurs';

export interface FactoringIntegration {
  id: string;
  tenant_id: string;
  provider: FactoringProvider;
  merchant_id: string;
  api_key_id: string;
  api_key_enc: string;
  hmac_algo: 'sha256';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type FactoringOfferStatus = 'pending' | 'offered' | 'accepted' | 'rejected' | 'failed';

export interface FactoringOffer {
  id: string;
  tenant_id: string;
  invoice_id: string;
  provider: FactoringProvider;
  request_payload: unknown;
  response_payload?: unknown;
  status: FactoringOfferStatus;
  offer_amount?: number;
  fees?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FactoringPayment {
  id: string;
  tenant_id: string;
  offer_id: string;
  provider: FactoringProvider;
  payout_amount: number;
  payout_date: string;
  reference?: string;
  raw?: unknown;
  created_at: string;
}

export interface FactoringWebhook {
  id: string;
  tenant_id: string;
  provider: FactoringProvider;
  event_type: string;
  signature?: string;
  payload: unknown;
  processed_at?: string;
  created_at: string;
}

