'use client'

import { useQuery } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { extractErrorMessage } from '@/lib/errorUtils'
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
   const response = await fetch('/api/employees/list', { cache: 'no-store' })
   
   if (!response.ok) {
    let errorMessage = 'Kunde inte hämta anställda'
    try {
     const errorData = await response.json()
     console.error('Error fetching employees - response:', errorData, 'status:', response.status)
     errorMessage = errorData.error || errorData.message || `Server error (${response.status})`
    } catch (e) {
     // Response är inte JSON, försök läsa som text
     try {
      const errorText = await response.text()
      console.error('Error fetching employees - text response:', errorText, 'status:', response.status)
      errorMessage = errorText || `Server error (${response.status})`
     } catch (textError) {
      console.error('Error fetching employees - could not read response:', textError)
      errorMessage = `Server error (${response.status})`
     }
    }
    throw new Error(errorMessage)
   }

   const data = await response.json()
   return (data.employees || []) as Employee[]
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 10, // 10 minuter stale time (anställda ändras sällan)
 })
}

