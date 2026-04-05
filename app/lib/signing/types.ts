export interface SigningRequest {
  documentTitle: string
  documentPdfBase64: string
  signatories: Array<{ reference: string }>
  webhookUrl: string
}

export interface SigningOrder {
  id: string
  status: 'OPEN' | 'CLOSED' | 'CANCELLED' | 'EXPIRED'
  documents: Array<{ id: string; title: string }>
  signatories: Array<{
    id: string
    reference: string
    status: 'OPEN' | 'SIGNED' | 'REJECTED' | 'ERROR'
    href: string
  }>
}

export interface SigningWebhookEvent {
  event: 'SIGNATORY_SIGNED' | 'SIGNATORY_REJECTED' | 'SIGNATURE_ORDER_EXPIRED'
  signatureOrderId: string
  signatoryId: string
}

export interface SignedDocument {
  id: string
  title: string
  blob: string
}
