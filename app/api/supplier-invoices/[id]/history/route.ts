// app/api/supplier-invoices/[id]/history/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getTenantId } from '@/lib/serverTenant'
import { createAdminClient } from '@/utils/supabase/admin'
import { extractErrorMessage } from '@/lib/errorUtils'

export const runtime = 'nodejs'

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { id } = await params

    const { data, error } = await admin
      .from('supplier_invoice_history')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('supplier_invoice_id', id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: extractErrorMessage(error) },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: extractErrorMessage(e) },
      { status: 500 }
    )
  }
}

