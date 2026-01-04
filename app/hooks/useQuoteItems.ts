// app/hooks/useQuoteItems.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QuotesAPI } from '@/lib/api/quotes'
import type { QuoteItem } from '@/types/quotes'
import { toast } from 'sonner'

export function useQuoteItems(quoteId: string) {
 return useQuery({
  queryKey: ['quote-items', quoteId],
  queryFn: () => QuotesAPI.getItems(quoteId),
  enabled: !!quoteId
 })
}

export function useCreateQuoteItem(quoteId: string) {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: (data: Partial<QuoteItem>) => QuotesAPI.createItem(quoteId, data),
  onSuccess: () => {
   // Invalida både items och quote (för totals)
   queryClient.invalidateQueries({ queryKey: ['quote-items', quoteId] })
   queryClient.invalidateQueries({ queryKey: ['quotes', quoteId] })
   toast.success('Artikel tillagd!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

export function useUpdateQuoteItem(quoteId: string) {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: ({ itemId, data }: { itemId: string; data: Partial<QuoteItem> }) =>
   QuotesAPI.updateItem(quoteId, itemId, data),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['quote-items', quoteId] })
   queryClient.invalidateQueries({ queryKey: ['quotes', quoteId] })
   toast.success('Artikel uppdaterad!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

export function useDeleteQuoteItem(quoteId: string) {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: (itemId: string) => QuotesAPI.deleteItem(quoteId, itemId),
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['quote-items', quoteId] })
   queryClient.invalidateQueries({ queryKey: ['quotes', quoteId] })
   toast.success('Artikel raderad!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

