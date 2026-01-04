// app/hooks/useSuppliers.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'
import type { Supplier } from '@/types/supplierInvoices'

export function useSuppliers(search?: string) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['suppliers', tenantId, search],
  queryFn: async () => {
   const params = new URLSearchParams()
   if (search) params.set('search', search)

   const res = await fetch(`/api/suppliers?${params}`)
   if (!res.ok) throw new Error('Failed to fetch suppliers')

   const result = await res.json()
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
   const res = await fetch('/api/suppliers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create supplier')
   }

   return res.json()
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

