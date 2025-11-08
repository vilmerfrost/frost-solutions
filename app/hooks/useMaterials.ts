// app/hooks/useMaterials.ts (uppdaterad & komplett)
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
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

      const res = await fetch(`/api/materials?${params}`)
      if (!res.ok) throw new Error('Failed to fetch materials')
      return res.json()
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
      const res = await fetch(`/api/materials/${id}`)
      if (!res.ok) throw new Error('Failed to fetch material')
      const result = await res.json()
      return result.data
    },
    enabled: !!id && !!tenantId,
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: Partial<Material>) => {
      const res = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create material')
      }
      return res.json()
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
      const res = await fetch(`/api/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to update material')
      }
      return res.json()
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
      const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to delete material')
      }
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
