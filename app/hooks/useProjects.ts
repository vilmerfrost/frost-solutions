'use client'

import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { extractErrorMessage } from '@/lib/errorUtils'
import type { Project } from '@/types/supabase'

/**
 * React Query hook för att hämta projekt
 */
export function useProjects() {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['projects', tenantId],
  queryFn: async () => {
   if (!tenantId) return []

   const response = await fetch(`/api/projects/list?tenantId=${tenantId}`, { cache: 'no-store' })
   
   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }))
    console.error('Error fetching projects:', errorData)
    throw new Error(errorData.error || 'Kunde inte hämta projekt')
   }

   const data = await response.json()
   return (data.projects || data || []) as Project[]
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 10, // 10 minuter stale time
 })
}
