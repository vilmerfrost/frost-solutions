/**
 * @jest-environment node
 */
import { apiSuccess, apiError, apiPaginated } from '@/lib/api/response'

describe('apiSuccess', () => {
  it('returns success response with data and default 200 status', async () => {
    const res = apiSuccess({ id: 1, name: 'test' })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual({ success: true, data: { id: 1, name: 'test' } })
  })

  it('accepts a custom status code', async () => {
    const res = apiSuccess({ created: true }, 201)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.success).toBe(true)
    expect(body.data).toEqual({ created: true })
  })

  it('handles null data', async () => {
    const res = apiSuccess(null)
    const body = await res.json()

    expect(body).toEqual({ success: true, data: null })
  })

  it('handles array data', async () => {
    const res = apiSuccess([1, 2, 3])
    const body = await res.json()

    expect(body.data).toEqual([1, 2, 3])
  })
})

describe('apiError', () => {
  it('returns error response with default 500 status', async () => {
    const res = apiError('Something went wrong')
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ success: false, error: 'Something went wrong' })
  })

  it('accepts a custom status code', async () => {
    const res = apiError('Not found', 404)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body.error).toBe('Not found')
  })

  it('includes details when provided', async () => {
    const res = apiError('Validation failed', 400, { issues: ['field: required'] })
    const body = await res.json()

    expect(body).toEqual({
      success: false,
      error: 'Validation failed',
      details: { issues: ['field: required'] },
    })
  })

  it('omits details when not provided', async () => {
    const res = apiError('Fail', 500)
    const body = await res.json()

    expect(body).not.toHaveProperty('details')
  })
})

describe('apiPaginated', () => {
  it('returns paginated response with correct meta', async () => {
    const items = [{ id: 1 }, { id: 2 }]
    const res = apiPaginated(items, { page: 1, limit: 10, total: 25 })
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toEqual(items)
    expect(body.meta).toEqual({
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasMore: true,
    })
  })

  it('sets hasMore to false on last page', async () => {
    const res = apiPaginated([{ id: 1 }], { page: 3, limit: 10, total: 25 })
    const body = await res.json()

    expect(body.meta.hasMore).toBe(false)
  })

  it('handles empty data array', async () => {
    const res = apiPaginated([], { page: 1, limit: 10, total: 0 })
    const body = await res.json()

    expect(body.data).toEqual([])
    expect(body.meta.totalPages).toBe(0)
    expect(body.meta.hasMore).toBe(false)
  })

  it('calculates totalPages correctly for exact division', async () => {
    const res = apiPaginated([{ id: 1 }], { page: 1, limit: 5, total: 20 })
    const body = await res.json()

    expect(body.meta.totalPages).toBe(4)
  })
})
