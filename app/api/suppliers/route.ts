// app/api/suppliers/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const search = searchParams.get('search')

    const admin = createAdminClient()

    let query = admin
      .from('suppliers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true })

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Suppliers API] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error: any) {
    console.error('[Suppliers API] Unexpected error:', error)
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, org_number, email, phone } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Get user ID
    const { data: { user } } = await admin.auth.getUser()

    const { data, error } = await admin
      .from('suppliers')
      .insert({
        tenant_id: tenantId,
        name,
        org_number: org_number || null,
        email: email || null,
        phone: phone || null
      })
      .select()
      .single()

    if (error) {
      console.error('[Suppliers API] Create error:', error)
      return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[Suppliers API] Unexpected error:', error)
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 })
  }
}

