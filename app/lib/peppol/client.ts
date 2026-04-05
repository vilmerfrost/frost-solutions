/**
 * PEPPOL e-invoicing client via peppol.sh REST API.
 * @peppol-sh/sdk does not exist on npm, so we use direct fetch calls.
 */

const PEPPOL_API_BASE = 'https://api.peppol.sh/v1'

function getApiKey(): string {
  const apiKey = process.env.PEPPOL_API_KEY
  if (!apiKey) throw new Error('PEPPOL_API_KEY is required')
  return apiKey
}

async function peppolFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${PEPPOL_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`PEPPOL API error: ${res.status} ${text}`)
  }

  return res.json()
}

export interface PeppolSendResult {
  id: string
  status: string
  message?: string
}

export async function sendInvoice(invoice: Record<string, unknown>): Promise<PeppolSendResult> {
  return peppolFetch<PeppolSendResult>('/invoices/send', {
    method: 'POST',
    body: JSON.stringify(invoice),
  })
}

export async function getInvoiceStatus(invoiceId: string): Promise<{ id: string; status: string }> {
  return peppolFetch<{ id: string; status: string }>(`/invoices/${invoiceId}`)
}
