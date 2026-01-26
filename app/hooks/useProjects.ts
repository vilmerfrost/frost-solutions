'use client'

import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
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

   const data = await apiFetch<{ projects?: Project[] }>(`/api/projects/list?tenantId=${tenantId}`, { cache: 'no-store' })
   return (data.projects || []) as Project[]
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 10, // 10 minuter stale time
 })
}
