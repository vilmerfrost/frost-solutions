import { z } from 'zod'
import { apiError } from './response'
import { NextRequest } from 'next/server'

export async function parseBody<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: ReturnType<typeof apiError> }> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return { data: null, error: apiError('Invalid JSON body', 400) }
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return { data: null, error: apiError('Validation failed', 400, { issues }) }
  }

  return { data: result.data, error: null }
}

export function parseSearchParams<T extends z.ZodSchema>(
  req: NextRequest,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: ReturnType<typeof apiError> } {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries())
  const result = schema.safeParse(params)
  if (!result.success) {
    const issues = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
    return { data: null, error: apiError('Invalid query parameters', 400, { issues }) }
  }
  return { data: result.data, error: null }
}
