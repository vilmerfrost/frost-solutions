import { createSigningOrder, getSigningOrder, closeSigningOrder, cancelSigningOrder } from '@/lib/signing/idura-client'

const mockFetch = jest.fn()
global.fetch = mockFetch as unknown as typeof fetch

describe('idura-client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.IDURA_CLIENT_ID = 'test-client-id'
    process.env.IDURA_CLIENT_SECRET = 'test-client-secret'
  })

  afterEach(() => {
    delete process.env.IDURA_CLIENT_ID
    delete process.env.IDURA_CLIENT_SECRET
  })

  it('throws on missing credentials', async () => {
    delete process.env.IDURA_CLIENT_ID
    delete process.env.IDURA_CLIENT_SECRET

    await expect(createSigningOrder({
      documentTitle: 'Test',
      documentPdfBase64: 'base64pdf',
      signatories: [{ reference: 'user-1' }],
      webhookUrl: 'https://example.com/webhook',
    })).rejects.toThrow('IDURA_CLIENT_ID and IDURA_CLIENT_SECRET are required')
  })

  it('createSigningOrder constructs correct GraphQL body', async () => {
    const mockOrder = {
      id: 'order-1',
      status: 'OPEN',
      documents: [{ id: 'doc-1', title: 'Quote' }],
      signatories: [{ id: 'sig-1', reference: 'user-1', status: 'OPEN', href: 'https://sign.example.com/sig-1' }],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { createSignatureOrder: { signatureOrder: mockOrder } } }),
    })

    const result = await createSigningOrder({
      documentTitle: 'Quote',
      documentPdfBase64: 'base64pdf',
      signatories: [{ reference: 'user-1' }],
      webhookUrl: 'https://example.com/webhook',
    })

    expect(result).toEqual(mockOrder)

    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://signatures-api.criipto.com/v1/graphql')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(options.headers['Authorization']).toMatch(/^Basic /)

    const body = JSON.parse(options.body)
    expect(body.query).toContain('createSignatureOrder')
    expect(body.variables.input.documents[0].pdf.title).toBe('Quote')
    expect(body.variables.input.signatories[0].reference).toBe('user-1')
    expect(body.variables.input.webhook.uri).toBe('https://example.com/webhook')
  })

  it('getSigningOrder queries by ID', async () => {
    const mockOrder = {
      id: 'order-1',
      status: 'OPEN',
      documents: [],
      signatories: [],
    }

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { signatureOrder: mockOrder } }),
    })

    const result = await getSigningOrder('order-1')
    expect(result).toEqual(mockOrder)

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.query).toContain('signatureOrder')
    expect(body.variables.id).toBe('order-1')
  })

  it('closeSigningOrder returns signed documents', async () => {
    const mockDocs = [{ id: 'doc-1', title: 'Quote', blob: 'signed-base64' }]

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { closeSignatureOrder: { signatureOrder: { documents: mockDocs } } } }),
    })

    const result = await closeSigningOrder('order-1')
    expect(result).toEqual(mockDocs)
  })

  it('cancelSigningOrder sends cancel mutation', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { cancelSignatureOrder: { signatureOrder: { id: 'order-1', status: 'CANCELLED' } } } }),
    })

    await cancelSigningOrder('order-1')

    const body = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(body.query).toContain('cancelSignatureOrder')
    expect(body.variables.input.signatureOrderId).toBe('order-1')
  })

  it('throws on GraphQL errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ errors: [{ message: 'Invalid input' }] }),
    })

    await expect(getSigningOrder('bad-id')).rejects.toThrow('Idura GraphQL error: Invalid input')
  })

  it('throws on HTTP errors', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    })

    await expect(getSigningOrder('order-1')).rejects.toThrow('Idura API error: 401 Unauthorized')
  })
})
