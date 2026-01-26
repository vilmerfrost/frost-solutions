// app/hooks/useSuppliers.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import type { Supplier } from '@/types/supplierInvoices'

export function useSuppliers(search?: string) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['suppliers', tenantId, search],
  queryFn: async () => {
   const params = new URLSearchParams()
   if (search) params.set('search', search)

   const result = await apiFetch<{ data: Supplier[] }>(`/api/suppliers?${params}`)
   return result.data as Supplier[]
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 5
 })
}

export function useCreateSupplier() {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: async (data: Partial<Supplier>) => {
   return apiFetch('/api/suppliers', {
    method: 'POST',
    body: JSON.stringify(data)
   })
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['suppliers'] })
   toast.success('Leverantör skapad!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

