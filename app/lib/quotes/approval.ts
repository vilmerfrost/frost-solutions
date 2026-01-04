import { createAdminClient } from '@/utils/supabase/admin'

export async function approveQuote(
 tenantId: string,
 quoteId: string,
 userId: string,
 level: number,
 reason?: string
) {
 const admin = createAdminClient()

 // Kontrollera att user är approver för denna nivå
 const { data: approver, error: approverErr } = await admin
  .from('quote_approvals')
  .select('id, status')
  .eq('tenant_id', tenantId)
  .eq('quote_id', quoteId)
  .eq('approver_user_id', userId)
  .eq('level', level)
  .maybeSingle()

 if (approverErr || !approver) throw new Error('Du är inte godkännare för denna offert/level')

 if (approver.status !== 'pending') throw new Error('Detta approval-steg är redan hanterat')

 // Uppdatera approval
 const { error: updErr } = await admin
  .from('quote_approvals')
  .update({ status: 'approved', reason: reason ?? null, changed_at: new Date().toISOString() })
  .eq('id', approver.id)
 if (updErr) throw updErr

 // Är alla approvals klara?
 const { data: pendingCount, error: pcErr } = await admin
  .from('quote_approvals')
  .select('id', { count: 'exact', head: true })
  .eq('tenant_id', tenantId)
  .eq('quote_id', quoteId)
  .eq('status', 'pending')

 if (pcErr) throw pcErr

 const allApproved = (pendingCount?.length === 0)

 if (allApproved) {
  // citera transitions i din status-API
  await admin.from('quotes').update({ status: 'approved', approved_at: new Date().toISOString() })
   .eq('tenant_id', tenantId).eq('id', quoteId)

  await logQuoteChange(tenantId, quoteId, 'approved', { userId })
 }
}

export async function logQuoteChange(
 tenantId: string,
 quoteId: string,
 event: string,
 data?: any,
 changedBy?: string
) {
 const admin = createAdminClient()
 await admin.from('quote_history').insert({
  tenant_id: tenantId,
  quote_id: quoteId,
  event_type: event,
  event_data: data ?? null,
  changed_by: changedBy ?? null
 })
}

