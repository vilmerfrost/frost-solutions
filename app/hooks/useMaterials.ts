// app/hooks/useMaterials.ts (uppdaterad & komplett)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { toast } from '@/lib/toast'
import type { Material, MaterialFilters } from '@/types/materials'

export function useMaterials(filters?: MaterialFilters) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['materials', tenantId, filters],
  queryFn: async () => {
   const params = new URLSearchParams()
   if (filters?.search) params.set('search', filters.search)
   if (filters?.category) params.set('category', filters.category)
   if (filters?.page) params.set('page', String(filters.page))
   if (filters?.limit) params.set('limit', String(filters.limit))

   return apiFetch(`/api/materials?${params}`)
  },
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 5,
 })
}

export function useMaterial(id: string | null) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['materials', id],
  queryFn: async () => {
   if (!id) throw new Error('Material ID is required')
   const result = await apiFetch<{ data: Material }>(`/api/materials/${id}`)
   return result.data
  },
  enabled: !!id && !!tenantId,
 })
}

export function useCreateMaterial() {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: async (data: Partial<Material>) => {
   return apiFetch('/api/materials', {
    method: 'POST',
    body: JSON.stringify(data),
   })
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['materials'] })
   toast.success('Material skapat!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  },
 })
}

export function useUpdateMaterial(id: string) {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: async (data: Partial<Material>) => {
   return apiFetch(`/api/materials/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
   })
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['materials', id] })
   queryClient.invalidateQueries({ queryKey: ['materials'] })
   toast.success('Material uppdaterat!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  },
 })
}

export function useDeleteMaterial() {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: async (id: string) => {
   await apiFetch(`/api/materials/${id}`, { method: 'DELETE' })
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['materials'] })
   toast.success('Material raderat!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  },
 })
}
