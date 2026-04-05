// app/api/suppliers/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseBody, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export const runtime = 'nodejs'

const CreateSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  org_number: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const search = req.nextUrl.searchParams.get('search')

    let query = auth.admin
      .from('suppliers')
      .select('*')
      .eq('tenant_id', auth.tenantId)
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Suppliers API] Error:', error)
      return apiError('Failed to fetch suppliers', 500)
    }

    return apiSuccess(data || [])
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const body = await parseBody(req, CreateSupplierSchema)
    if (body.error) return body.error

    const { name, org_number, email, phone } = body.data

    const { data, error } = await auth.admin
      .from('suppliers')
      .insert({
        tenant_id: auth.tenantId,
        name,
        org_number: org_number || null,
        email: email || null,
        phone: phone || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Suppliers API] Create error:', error)
      return apiError(error.message || 'Failed to create supplier', 500)
    }

    return apiSuccess(data, 201)
  } catch (error) {
    return handleRouteError(error)
  }
}
