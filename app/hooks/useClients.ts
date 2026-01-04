'use client'

import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import supabase from '@/utils/supabase/supabaseClient'
import { extractErrorMessage } from '@/lib/errorUtils'
import type { Client } from '@/types/supabase'

/**
 * React Query hook för att hämta kunder
 */
export function useClients() {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['clients', tenantId],
  queryFn: async () => {
   if (!tenantId) return []

   const { data, error } = await supabase
    .from('clients')
    .select('id, name, email, org_number, address, phone, archived')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

   if (error) {
    throw new Error(extractErrorMessage(error))
   }

   return (data || []) as Client[]
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 5, // 5 minuter stale time
 })
}

