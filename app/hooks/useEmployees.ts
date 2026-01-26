'use client'

import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import type { Employee } from '@/types/supabase'

/**
 * React Query hook för att hämta anställda
 * Använder API route för att kringgå RLS-problem
 */
export function useEmployees() {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['employees', tenantId],
  queryFn: async () => {
   if (!tenantId) return []

   // Använd API route istället för direkt Supabase för att undvika RLS-problem
   const data = await apiFetch<{ employees?: Employee[] }>('/api/employees/list', { cache: 'no-store' })
   return (data.employees || []) as Employee[]
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 10, // 10 minuter stale time (anställda ändras sällan)
 })
}

