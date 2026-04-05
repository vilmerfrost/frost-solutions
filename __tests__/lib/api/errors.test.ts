/**
 * @jest-environment node
 */
import { handleRouteError } from '@/lib/api/errors'

describe('handleRouteError', () => {
  it('uses status from Error with a status property', async () => {
    const error = Object.assign(new Error('Not found'), { status: 404 })
    const res = handleRouteError(error)
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body).toEqual({ success: false, error: 'Not found' })
  })

  it('defaults to 500 when Error has no status property', async () => {
    const error = new Error('Something broke')
    const res = handleRouteError(error)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ success: false, error: 'Something broke' })
  })

  it('returns 500 with generic message for non-Error values', async () => {
    const resString = handleRouteError('oops')
    const bodyString = await resString.json()

    expect(resString.status).toBe(500)
    expect(bodyString).toEqual({ success: false, error: 'An unexpected error occurred' })

    const resNull = handleRouteError(null)
    const bodyNull = await resNull.json()

    expect(resNull.status).toBe(500)
    expect(bodyNull).toEqual({ success: false, error: 'An unexpected error occurred' })
  })
})
