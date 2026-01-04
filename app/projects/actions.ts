'use server'

import { createClient } from '../utils/supabase/server'
import { redirect } from 'next/navigation'
import { getTenantId } from '@/lib/serverTenant'

export async function createProject(formData: FormData) {
 const supabase = createClient()

 const {
  data: { user },
  error: userErr,
 } = await supabase.auth.getUser()
 if (userErr || !user) {
  redirect('/login')
 }

 const tenantId = await getTenantId()
 if (!tenantId) {
  redirect('/projects?err=' + encodeURIComponent('Ingen tenant hittades. Logga in igen.'))
 }

 const name = String(formData.get('name') || '').trim()
 const client_id = String(formData.get('client_id') || '').trim()
 const customer_name = String(formData.get('customer_name') || '').trim()

 const base_rate_sek = Number(formData.get('base_rate_sek') || 0)
 const budgeted_hours = Number(formData.get('budgeted_hours') || 0)
 const status = String(formData.get('status') || 'planned').trim()

 if (!name) {
  redirect('/projects?err=' + encodeURIComponent('Fyll i projektnamn'))
 }

 if (!client_id) {
  redirect('/projects?err=' + encodeURIComponent('Ett projekt måste ha en kund'))
 }

 // Build insert payload - only include status if column exists
 const insertPayload: any = {
  name,
  tenant_id: tenantId,
  client_id,
  base_rate_sek,
  budgeted_hours,
  customer_name, // For backward compatibility
 }

 // Try to insert with status first
 let { error } = await supabase.from('projects').insert([{ ...insertPayload, status }])

 // If status column doesn't exist, retry without it
 if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('status'))) {
  const { error: retryError } = await supabase.from('projects').insert([insertPayload])
  if (retryError) {
   error = retryError
  } else {
   error = null // Success on retry
  }
 }

 if (error) {
  redirect('/projects?err=' + encodeURIComponent(error.message))
 }

 redirect('/projects?created=1')
}

