// app/api/materials/route.ts
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
  const category = searchParams.get('category')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const admin = createAdminClient()
  let query = admin
   .from('materials')
   .select('*', { count: 'exact' })
   .eq('tenant_id', tenantId)
   .order('name', { ascending: true })

  if (search) {
   query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`)
  }

  if (category) {
   query = query.eq('category', category)
  }

  const from = (page - 1) * limit
  const to = from + limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
   console.error('[Materials API] Error:', error)
   return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 })
  }

  return NextResponse.json({
   success: true,
   data: data || [],
   meta: {
    page,
    limit,
    count: count || 0,
   },
  })
 } catch (error: any) {
  console.error('[Materials API] Unexpected error:', error)
  return NextResponse.json(
   { error: extractErrorMessage(error.message || 'Internal server error') },
   { status: 500 }
  )
 }
}

export async function POST(req: NextRequest) {
 try {
  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { sku, name, category, unit, price } = body

  if (!name || !unit || price === undefined) {
   return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
   .from('materials')
   .insert({
    tenant_id: tenantId,
    sku: sku || null,
    name,
    category: category || null,
    unit,
    price,
   })
   .select()
   .single()

  if (error) {
   console.error('[Materials API] Create error:', error)
   return NextResponse.json(
    { error: extractErrorMessage(error.message || 'Failed to create material') },
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

