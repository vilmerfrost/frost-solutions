'use server'

import { redirect } from 'next/navigation'
import { createClient } from '../../utils/supabase/server'

export async function createLockedInvoice(projectId: string) {
 const supabase = createClient()

 // Kör RPC som din inloggade användare; funkar om RLS/tenant stämmer.
 const { data, error } = await supabase
  .rpc('create_invoice_from_project', { p_project_id: projectId, p_due_days: 30 })

 if (error) {
  console.error('create_invoice_from_project error', error)
  throw new Error(error.message)
 }

 // Skicka användaren till den låsta fakturan
 redirect(`/invoices/${data}`)
}

