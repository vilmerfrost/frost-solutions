// app/api/materials/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const materialId = params.id

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('materials')
      .select('*')
      .eq('id', materialId)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('[Materials API] Get error:', error)
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[Materials API] Unexpected error:', error)
    return NextResponse.json(
      { error: extractErrorMessage(error.message || 'Internal server error') },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const materialId = params.id
    const body = await req.json()

    const admin = createAdminClient()
    const { data, error } = await admin
      .from('materials')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', materialId)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      console.error('[Materials API] Update error:', error)
      return NextResponse.json(
        { error: extractErrorMessage(error.message || 'Failed to update material') },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('[Materials API] Unexpected error:', error)
    return NextResponse.json(
      { error: extractErrorMessage(error.message || 'Internal server error') },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = await Promise.resolve(context.params)
    const materialId = params.id

    const admin = createAdminClient()
    const { error } = await admin
      .from('materials')
      .delete()
      .eq('id', materialId)
      .eq('tenant_id', tenantId)

    if (error) {
      console.error('[Materials API] Delete error:', error)
      return NextResponse.json(
        { error: extractErrorMessage(error.message || 'Failed to delete material') },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('[Materials API] Unexpected error:', error)
    return NextResponse.json(
      { error: extractErrorMessage(error.message || 'Internal server error') },
      { status: 500 }
    )
  }
}

