import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { getTenantId } from '@/lib/serverTenant'
import { logQuoteChange } from '@/lib/quotes/approval'

export const runtime = 'nodejs'

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = await getTenantId()
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const admin = createAdminClient()

    const { data: q } = await admin
      .from('quotes')
      .select('id, status, title, customer_id, total_amount')
      .eq('tenant_id', tenantId)
      .eq('id', params.id)
      .maybeSingle()
    
    if (!q) {
      return NextResponse.json({ error: 'Offert saknas' }, { status: 404 })
    }
    
    if (q.status !== 'accepted') {
      return NextResponse.json({ error: 'Offert måste vara accepterad' }, { status: 400 })
    }

    // Skapa projekt
    const { data: proj, error: pErr } = await admin
      .from('projects')
      .insert({
        tenant_id: tenantId,
        name: q.title,
        client_id: q.customer_id,
        status: 'active',
        budgeted_hours: null,
        base_rate_sek: null
      })
      .select('id')
      .single()
    
    if (pErr) throw pErr

    // Todo: skapa tasks från items om ni har tasks-tabell
    await admin
      .from('quotes')
      .update({ status: 'archived' })
      .eq('tenant_id', tenantId)
      .eq('id', params.id)

    await logQuoteChange(tenantId, params.id, 'converted', { project_id: proj.id })

    return NextResponse.json({ success: true, projectId: proj.id })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

