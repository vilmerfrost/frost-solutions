// app/hooks/useQuotes.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { QuotesAPI } from '@/lib/api/quotes'
import type { Quote, QuoteFilters } from '@/types/quotes'
import { toast } from 'sonner'
import { useEffect, useRef } from 'react'

export function useQuotes(filters?: QuoteFilters) {
  const { tenantId } = useTenant()

  return useQuery({
    queryKey: ['quotes', tenantId, filters],
    queryFn: () => QuotesAPI.list(filters),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // 2 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
}

export function useQuote(id: string | null) {
  const { tenantId, isLoading: tenantLoading } = useTenant()
  const hasLoggedRef = useRef(false)

  // Log debugging info endast en gång
  useEffect(() => {
    if (!hasLoggedRef.current && id) {
      console.log('[useQuote] Hook initialized', {
        quoteId: id,
        tenantId,
        tenantLoading,
        enabled: !!id && !!tenantId && !tenantLoading,
      })
      hasLoggedRef.current = true
    }
  }, [id, tenantId, tenantLoading])

  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      console.log('[useQuote] Fetching quote...', { 
        quoteId: id, 
        tenantId,
        timestamp: new Date().toISOString(),
      })

      try {
        const quote = await QuotesAPI.get(id!)
        console.log('[useQuote] ✅ Quote fetched successfully', { 
          quoteId: id,
          quoteNumber: quote.quote_number,
          status: quote.status,
        })
        return quote
      } catch (error: any) {
        console.error('[useQuote] ❌ Failed to fetch quote', {
          quoteId: id,
          tenantId,
          error: error.message,
          errorType: error.constructor?.name,
        })
        throw error
      }
    },
    // VIKTIGT: Vänta på att både id, tenantId finns OCH att tenant inte laddar
    enabled: !!id && !!tenantId && !tenantLoading,
    // Retry logic för att hantera tillfälliga fel
    retry: (failureCount, error: any) => {
      // Retry inte på 404 eller 401
      if (error?.message?.includes('404') || error?.message?.includes('401')) {
        console.warn('[useQuote] Not retrying due to 404/401 error')
        return false
      }
      // Retry upp till 3 gånger på andra fel
      return failureCount < 3
    },
    retryDelay: (attemptIndex) => {
      const delay = Math.min(1000 * 2 ** attemptIndex, 5000)
      console.log(`[useQuote] Retrying in ${delay}ms (attempt ${attemptIndex + 1})`)
      return delay
    },
    // Refetch strategier
    staleTime: 1000 * 60 * 5, // 5 min
    refetchOnWindowFocus: false, // Inte refetch vid window focus för detail view
    refetchOnMount: true,
  })
}

export function useCreateQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Quote>) => {
      console.log('[useCreateQuote] Creating quote...', { data })
      return QuotesAPI.create(data)
    },
    onSuccess: (newQuote) => {
      console.log('[useCreateQuote] ✅ Quote created', { 
        quoteId: newQuote.id,
        quoteNumber: newQuote.quote_number,
      })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Offert skapad!')
    },
    onError: (error: Error) => {
      console.error('[useCreateQuote] ❌ Failed to create quote', { error: error.message })
      toast.error(error.message)
    },
  })
}

export function useUpdateQuote(id: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<Quote>) => {
      console.log('[useUpdateQuote] Updating quote...', { quoteId: id, data })
      return QuotesAPI.update(id, data)
    },
    onSuccess: (updatedQuote) => {
      console.log('[useUpdateQuote] ✅ Quote updated', { 
        quoteId: id,
        quoteNumber: updatedQuote.quote_number,
      })
      queryClient.invalidateQueries({ queryKey: ['quotes', id] })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Offert uppdaterad!')
    },
    onError: (error: Error) => {
      console.error('[useUpdateQuote] ❌ Failed to update quote', { 
        quoteId: id,
        error: error.message 
      })
      toast.error(error.message)
    },
  })
}

export function useDeleteQuote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => {
      console.log('[useDeleteQuote] Deleting quote...', { quoteId: id })
      return QuotesAPI.delete(id)
    },
    onSuccess: (_, deletedId) => {
      console.log('[useDeleteQuote] ✅ Quote deleted', { quoteId: deletedId })
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      toast.success('Offert raderad!')
    },
    onError: (error: Error) => {
      console.error('[useDeleteQuote] ❌ Failed to delete quote', { error: error.message })
      toast.error(error.message)
    },
  })
}

