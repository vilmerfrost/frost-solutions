// app/hooks/useQuotes.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { QuotesAPI } from '@/lib/api/quotes'
import type { Quote, QuoteFilters } from '@/types/quotes'
import { toast } from 'sonner'

export function useQuotes(filters?: QuoteFilters) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['quotes', tenantId, filters],
    queryFn: () => QuotesAPI.list(filters),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2 // 2 min
  })
}

export function useQuote(id: string | null) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => QuotesAPI.get(id!),
    enabled: !!id && !!tenantId
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Quote>) => QuotesAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Offert skapad!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useUpdateQuote(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Quote>) => QuotesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Offert uppdaterad!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => QuotesAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Offert raderad!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    }
  })
}

