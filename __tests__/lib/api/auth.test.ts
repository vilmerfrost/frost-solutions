/**
 * @jest-environment node
 */
import { resolveAuth, resolveAuthAdmin } from '@/lib/api/auth'

const mockGetUser = jest.fn()

jest.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
  }),
}))

const mockAdminClient = { from: jest.fn() }
jest.mock('@/utils/supabase/admin', () => ({
  createAdminClient: () => mockAdminClient,
}))

describe('resolveAuth', () => {
  afterEach(() => {
    mockGetUser.mockReset()
  })

  it('returns user and tenantId on successful auth', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: { tenant_id: 'tenant-456' },
        },
      },
      error: null,
    })

    const result = await resolveAuth()

    expect(result.error).toBeNull()
    expect(result.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      app_metadata: { tenant_id: 'tenant-456' },
    })
    expect(result.tenantId).toBe('tenant-456')
  })

  it('returns 401 error when getUser fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Invalid token'),
    })

    const result = await resolveAuth()

    expect(result.user).toBeNull()
    expect(result.tenantId).toBeNull()
    expect(result.error).not.toBeNull()

    const body = await result.error!.json()
    expect(body.error).toBe('Unauthorized')
    expect(result.error!.status).toBe(401)
  })

  it('returns 401 error when user is null', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const result = await resolveAuth()
    expect(result.user).toBeNull()
    expect(result.error!.status).toBe(401)
  })

  it('returns 403 error when tenant_id is missing from app_metadata', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: {},
        },
      },
      error: null,
    })

    const result = await resolveAuth()

    expect(result.user).toBeNull()
    expect(result.tenantId).toBeNull()

    const body = await result.error!.json()
    expect(body.error).toBe('No tenant associated with user')
    expect(result.error!.status).toBe(403)
  })

  it('handles user with null email gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: null,
          app_metadata: { tenant_id: 'tenant-456' },
        },
      },
      error: null,
    })

    const result = await resolveAuth()

    expect(result.user?.email).toBe('')
    expect(result.tenantId).toBe('tenant-456')
  })

  it('handles user with null app_metadata gracefully', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: null,
        },
      },
      error: null,
    })

    const result = await resolveAuth()

    // tenant_id won't exist on null metadata, so 403
    expect(result.error!.status).toBe(403)
  })
})

describe('resolveAuthAdmin', () => {
  afterEach(() => {
    mockGetUser.mockReset()
  })

  it('returns admin client alongside user info on success', async () => {
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          app_metadata: { tenant_id: 'tenant-456' },
        },
      },
      error: null,
    })

    const result = await resolveAuthAdmin()

    expect(result.error).toBeNull()
    expect(result.tenantId).toBe('tenant-456')
    expect(result).toHaveProperty('admin')
  })

  it('returns error without admin client when auth fails', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Unauthorized'),
    })

    const result = await resolveAuthAdmin()

    expect(result.error).not.toBeNull()
    expect(result).not.toHaveProperty('admin')
  })
})
