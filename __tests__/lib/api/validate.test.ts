/**
 * @jest-environment node
 */
import { z } from 'zod'
import { parseBody, parseSearchParams } from '@/lib/api/validate'
import { NextRequest } from 'next/server'

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeGetRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/test')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return new NextRequest(url)
}

describe('parseBody', () => {
  const schema = z.object({
    name: z.string(),
    age: z.number(),
  })

  it('returns parsed data for valid body', async () => {
    const req = makeRequest({ name: 'Alice', age: 30 })
    const result = await parseBody(req, schema)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ name: 'Alice', age: 30 })
  })

  it('returns 400 error for invalid JSON', async () => {
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json{{{',
    })

    const result = await parseBody(req, schema)

    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
    expect(result.error!.status).toBe(400)

    const body = await result.error!.json()
    expect(body.error).toBe('Invalid JSON body')
  })

  it('returns 400 error with issues for validation failure', async () => {
    const req = makeRequest({ name: 123, age: 'not a number' })
    const result = await parseBody(req, schema)

    expect(result.data).toBeNull()
    expect(result.error!.status).toBe(400)

    const body = await result.error!.json()
    expect(body.error).toBe('Validation failed')
    expect(body.details).toHaveProperty('issues')
    expect(Array.isArray(body.details.issues)).toBe(true)
    expect(body.details.issues.length).toBeGreaterThan(0)
  })

  it('returns 400 error for missing required fields', async () => {
    const req = makeRequest({ name: 'Alice' })
    const result = await parseBody(req, schema)

    expect(result.data).toBeNull()
    expect(result.error!.status).toBe(400)
  })

  it('works with optional fields in schema', async () => {
    const optionalSchema = z.object({
      name: z.string(),
      nickname: z.string().optional(),
    })

    const req = makeRequest({ name: 'Alice' })
    const result = await parseBody(req, optionalSchema)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ name: 'Alice' })
  })
})

describe('parseSearchParams', () => {
  const schema = z.object({
    page: z.string(),
    limit: z.string(),
  })

  it('returns parsed data for valid query params', () => {
    const req = makeGetRequest({ page: '1', limit: '10' })
    const result = parseSearchParams(req, schema)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ page: '1', limit: '10' })
  })

  it('returns 400 error for missing required params', () => {
    const req = makeGetRequest({ page: '1' })
    const result = parseSearchParams(req, schema)

    expect(result.data).toBeNull()
    expect(result.error!.status).toBe(400)
  })

  it('returns validation issues in details', async () => {
    const req = makeGetRequest({})
    const result = parseSearchParams(req, schema)

    expect(result.error!.status).toBe(400)
    const body = await result.error!.json()
    expect(body.error).toBe('Invalid query parameters')
    expect(body.details.issues.length).toBeGreaterThan(0)
  })

  it('works with coercion schemas', () => {
    const coerceSchema = z.object({
      page: z.coerce.number().min(1),
      limit: z.coerce.number().min(1).max(100),
    })

    const req = makeGetRequest({ page: '2', limit: '50' })
    const result = parseSearchParams(req, coerceSchema)

    expect(result.error).toBeNull()
    expect(result.data).toEqual({ page: 2, limit: 50 })
  })
})
