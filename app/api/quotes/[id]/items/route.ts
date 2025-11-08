import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const admin = createAdminClient()
    
    const { data, error } = await admin
      .from('quote_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('quote_id', params.id)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const admin = createAdminClient()
    const payload = { ...body, tenant_id: tenantId, quote_id: params.id }

    const { data, error } = await admin
      .from('quote_items')
      .insert(payload)
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json({ data }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const admin = createAdminClient()

    if (!body.id) {
      return NextResponse.json({ error: 'Item id required' }, { status: 400 })
    }

    const { data, error } = await admin
      .from('quote_items')
      .update(body)
      .eq('tenant_id', tenantId)
      .eq('id', body.id)
      .eq('quote_id', params.id)
      .select()
      .single()
    
    if (error) throw error
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json()
    const admin = createAdminClient()

    if (!body.id) {
      return NextResponse.json({ error: 'Item id required' }, { status: 400 })
    }

    const { error } = await admin
      .from('quote_items')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('id', body.id)
      .eq('quote_id', params.id)
    
    if (error) throw error
    return NextResponse.json({ success: true }, { status: 204 })
  } catch (e: any) {
    return NextResponse.json({ error: extractErrorMessage(e) }, { status: 500 })
  }
}

