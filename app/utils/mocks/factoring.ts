// app/utils/mocks/factoring.ts
/**
 * Mock data generators for Factoring
 * Based on Mistral AI recommendations
 */
import type { FactoringOffer } from '@/types/factoring';

export function generateMockFactoringOffer(): FactoringOffer {
 const statuses: FactoringOffer['status'][] = ['pending', 'offered', 'accepted', 'rejected', 'failed'];
 const status = statuses[Math.floor(Math.random() * statuses.length)];

 const invoiceAmount = Math.floor(Math.random() * 90000) + 10000; // 10k-100k
 const feePercentage = Math.random() * 3 + 1; // 1-4%
 const feeAmount = invoiceAmount * (feePercentage / 100);
 const netAmount = invoiceAmount - feeAmount;

 return {
  id: `factoring-offer-${Math.random().toString(36).substr(2, 9)}`,
  tenant_id: `tenant-${Math.random().toString(36).substr(2, 9)}`,
  invoice_id: `invoice-${Math.random().toString(36).substr(2, 9)}`,
  provider: 'resurs',
  request_payload: {
   invoiceAmount,
   feePercentage,
  },
  response_payload: {
   invoiceAmount,
   feePercentage,
   feeAmount,
   netAmount,
  },
  status,
  offer_amount: netAmount,
  fees: feeAmount,
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
 };
}

