import { SigningRequest, SigningOrder, SignedDocument } from './types'

const IDURA_API = 'https://signatures-api.criipto.com/v1/graphql'

function getAuth(): string {
  const clientId = process.env.IDURA_CLIENT_ID
  const clientSecret = process.env.IDURA_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('IDURA_CLIENT_ID and IDURA_CLIENT_SECRET are required')
  return 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
}

async function graphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(IDURA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': getAuth(),
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Idura API error: ${res.status} ${await res.text()}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(`Idura GraphQL error: ${json.errors[0].message}`)
  return json.data
}

export type AllowedEid = 'swedish_bankid' | 'freja_eid' | 'email'

const EID_PROVIDER_MAP: Record<AllowedEid, { __typename: string }> = {
  swedish_bankid: { __typename: 'CriiptoVerifyProviderInput' },
  freja_eid: { __typename: 'CriiptoVerifyProviderInput' },
  email: { __typename: 'DrawableSignatureProviderInput' },
}

function buildEvidenceProviders(allowedEids: AllowedEid[]) {
  // Map allowed EIDs to Criipto/Idura evidence provider inputs
  const providers: Record<string, unknown>[] = []

  const hasBankId = allowedEids.includes('swedish_bankid')
  const hasFreja = allowedEids.includes('freja_eid')

  if (hasBankId || hasFreja) {
    providers.push({
      criiptoVerify: {
        acrValues: [
          ...(hasBankId ? ['urn:grn:authn:se:bankid:same-device', 'urn:grn:authn:se:bankid:another-device'] : []),
          ...(hasFreja ? ['urn:grn:authn:se:freja:high'] : []),
        ],
        alwaysRedirect: true,
      },
    })
  }

  if (allowedEids.includes('email')) {
    providers.push({
      drawable: {
        requireName: true,
      },
    })
  }

  return providers
}

export async function createSigningOrder(request: SigningRequest & {
  allowedEids?: AllowedEid[]
}): Promise<SigningOrder> {
  // Default to allowing both Swedish BankID and Freja eID
  const allowedEids = request.allowedEids ?? ['swedish_bankid', 'freja_eid']
  const evidenceProviders = buildEvidenceProviders(allowedEids)

  const data = await graphql<{ createSignatureOrder: { signatureOrder: SigningOrder } }>(`
    mutation CreateOrder($input: CreateSignatureOrderInput!) {
      createSignatureOrder(input: $input) {
        signatureOrder {
          id
          status
          documents { id title }
          signatories { id reference status href }
        }
      }
    }
  `, {
    input: {
      documents: [{
        pdf: {
          title: request.documentTitle,
          storageMode: 'Temporary',
          blob: request.documentPdfBase64,
        }
      }],
      ...(evidenceProviders.length > 0 && { evidenceProviders }),
      signatories: request.signatories.map(s => ({ reference: s.reference })),
      webhook: { uri: request.webhookUrl },
    }
  })
  return data.createSignatureOrder.signatureOrder
}

export async function getSigningOrder(orderId: string): Promise<SigningOrder> {
  const data = await graphql<{ signatureOrder: SigningOrder }>(`
    query GetOrder($id: ID!) {
      signatureOrder(id: $id) {
        id status
        documents { id title }
        signatories { id reference status href }
      }
    }
  `, { id: orderId })
  return data.signatureOrder
}

export async function closeSigningOrder(orderId: string): Promise<SignedDocument[]> {
  const data = await graphql<{ closeSignatureOrder: { signatureOrder: { documents: SignedDocument[] } } }>(`
    mutation CloseOrder($input: CloseSignatureOrderInput!) {
      closeSignatureOrder(input: $input) {
        signatureOrder {
          documents { id title blob }
        }
      }
    }
  `, { input: { signatureOrderId: orderId } })
  return data.closeSignatureOrder.signatureOrder.documents
}

export async function cancelSigningOrder(orderId: string): Promise<void> {
  await graphql(`
    mutation CancelOrder($input: CancelSignatureOrderInput!) {
      cancelSignatureOrder(input: $input) {
        signatureOrder { id status }
      }
    }
  `, { input: { signatureOrderId: orderId } })
}
