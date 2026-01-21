'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import supabase from '@/utils/supabase/supabaseClient'
import { extractErrorMessage } from '@/lib/errorUtils'
import type { Invoice } from '@/types/supabase'

/**
 * React Query hook för att hämta fakturor
 * Använder caching och automatisk refetching
 */
export function useInvoices() {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['invoices', tenantId],
  queryFn: async () => {
   if (!tenantId) return []

   // Progressive fallback för saknade kolumner
   // Start without customer_id since it might not exist
   let { data, error } = await supabase
    .from('invoices')
    .select('id, amount, customer_name, client_id, project_id, number, status, issue_date')
    .eq('tenant_id', tenantId)
    .order('issue_date', { ascending: false })

   // Fallback 1: If issue_date doesn't exist
   if (error && (error.code === '42703' || error.code === '400') && error.message?.includes('issue_date')) {
    const fallback1 = await supabase
     .from('invoices')
     .select('id, amount, customer_name, client_id, project_id, number, status')
     .eq('tenant_id', tenantId)
     .order('id', { ascending: false })
    
    if (!fallback1.error) {
     data = fallback1.data
     error = null
    } else {
     error = fallback1.error
    }
   }

   // Fallback 2: If number doesn't exist
   if (error && (error.code === '42703' || error.code === '400') && error.message?.includes('number')) {
    const fallback2 = await supabase
     .from('invoices')
     .select('id, amount, customer_name, client_id, project_id, status, issue_date')
     .eq('tenant_id', tenantId)
     .order('issue_date', { ascending: false })
    
    if (!fallback2.error) {
     data = fallback2.data
     error = null
    } else {
     error = fallback2.error
    }
   }

   // Fallback 3: Minimal set
   if (error && (error.code === '42703' || error.code === '400')) {
    const fallback3 = await supabase
     .from('invoices')
     .select('id, amount, customer_name, client_id, project_id, status')
     .eq('tenant_id', tenantId)
     .order('id', { ascending: false })
    
    if (!fallback3.error) {
     data = fallback3.data
     error = null
    } else {
     error = fallback3.error
    }
   }

   if (error) {
    throw new Error(extractErrorMessage(error))
   }

   return (data || []).map((inv: any) => ({
    ...inv,
    amount: inv.amount || 0,
    status: inv.status || 'draft',
    number: inv.number || inv.id?.slice(0, 8) || 'N/A',
    created_at: inv.issue_date || null,
   })) as Invoice[]
  },
  enabled: !!tenantId, // Bara köra query om tenantId finns
  staleTime: 1000 * 60 * 2, // 2 minuter stale time för fakturor
 })
}

/**
 * React Query hook för att hämta en specifik faktura
 */
export function useInvoice(invoiceId: string | undefined) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['invoice', invoiceId, tenantId],
  queryFn: async () => {
   if (!invoiceId || !tenantId) return null

   // Progressive fallback - start without problematic columns
   let { data, error } = await supabase
    .from('invoices')
    .select('id, amount, customer_name, desc, description, status, issue_date, project_id, client_id')
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single()

   // Fallback 1: If desc doesn't exist
   if (error && (error.code === '42703' || error.code === '400') && error.message?.includes('desc')) {
    const fallback1: any = await supabase
     .from('invoices')
     .select('id, amount, customer_name, description, status, issue_date, project_id, client_id')
     .eq('id', invoiceId)
     .eq('tenant_id', tenantId)
     .single()
    
    if (!fallback1.error && fallback1.data) {
     data = { ...fallback1.data, desc: fallback1.data.description || null }
     error = null
    } else {
     error = fallback1.error
    }
   }

   // Fallback 2: If description also doesn't exist
   if (error && (error.code === '42703' || error.code === '400') && error.message?.includes('description')) {
    const fallback2: any = await supabase
     .from('invoices')
     .select('id, amount, customer_name, status, issue_date, project_id, client_id')
     .eq('id', invoiceId)
     .eq('tenant_id', tenantId)
     .single()
    
    if (!fallback2.error && fallback2.data) {
     data = fallback2.data
     error = null
    } else {
     error = fallback2.error
    }
   }

   // Fallback 3: Minimal set
   if (error && (error.code === '42703' || error.code === '400')) {
    const fallback3: any = await supabase
     .from('invoices')
     .select('id, amount, customer_name, project_id, client_id')
     .eq('id', invoiceId)
     .eq('tenant_id', tenantId)
     .single()
    
    if (!fallback3.error && fallback3.data) {
     data = fallback3.data
     error = null
    } else {
     error = fallback3.error
    }
   }

   if (error) {
    throw new Error(extractErrorMessage(error))
   }

   return data as Invoice | null
  },
  enabled: !!invoiceId && !!tenantId,
 })
}

/**
 * React Query mutation för att uppdatera en faktura
 */
export function useUpdateInvoice() {
 const queryClient = useQueryClient()
 const { tenantId } = useTenant()

 return useMutation({
  mutationFn: async ({ invoiceId, data }: { invoiceId: string; data: Partial<Invoice> }) => {
   if (!tenantId) throw new Error('Ingen tenant ID')

   const { error } = await (supabase
    .from('invoices') as any)
    .update(data)
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)

   if (error) {
    throw new Error(extractErrorMessage(error))
   }

   return { invoiceId, data }
  },
  onSuccess: (result) => {
   // Invalidera cache för att trigga refetch
   queryClient.invalidateQueries({ queryKey: ['invoice', result.invoiceId] })
   queryClient.invalidateQueries({ queryKey: ['invoices'] })
   
   // Dispatch event för andra komponenter
   if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
     detail: { invoiceId: result.invoiceId, timestamp: Date.now() }
    }))
   }
  },
 })
}

