// app/api/projects/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuth, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'
import { createClient } from '@/utils/supabase/server'

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  client_id: z.string().uuid().optional().nullable(),
  base_rate_sek: z.number().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget_hours: z.number().optional(),
  budget_amount: z.number().optional(),
}).passthrough()

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuth()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateProjectSchema)
    if (body.error) return body.error

    const { name, ...rest } = body.data

    const supabase = createClient()
    const { data, error } = await supabase
      .from('projects')
      .insert([{ name, tenant_id: auth.tenantId, created_by: auth.user.id, ...rest }])
      .select('*')
      .single()

    if (error) {
      return apiError(error.message, 400)
    }

    return apiSuccess({ project: data }, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}

// Redirect GET requests to /api/projects/list
export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuth()
    if (auth.error) return auth.error

    const url = new URL(req.url)
    url.pathname = '/api/projects/list'
    url.searchParams.set('tenantId', auth.tenantId)

    const { NextResponse } = await import('next/server')
    return NextResponse.redirect(url)
  } catch (error) {
    return handleRouteError(error)
  }
}
