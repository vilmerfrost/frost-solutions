// app/hooks/useQuoteActions.ts
'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QuotesAPI } from '@/lib/api/quotes'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function useSendQuote() {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: ({ quoteId, to }: { quoteId: string; to: string }) =>
   QuotesAPI.send(quoteId, to),
  onSuccess: (_, variables) => {
   queryClient.invalidateQueries({ queryKey: ['quotes', variables.quoteId] })
   queryClient.invalidateQueries({ queryKey: ['quotes'] })
   toast.success('Offert skickad via email!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

export function useApproveQuote() {
 const queryClient = useQueryClient()

 return useMutation({
  mutationFn: ({ quoteId, level, reason }: { quoteId: string; level: number; reason?: string }) =>
   QuotesAPI.approve(quoteId, level, reason),
  onSuccess: (_, variables) => {
   queryClient.invalidateQueries({ queryKey: ['quotes', variables.quoteId] })
   queryClient.invalidateQueries({ queryKey: ['quotes'] })
   toast.success('Offert godkänd!')
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

export function useConvertToProject() {
 const queryClient = useQueryClient()
 const router = useRouter()

 return useMutation({
  mutationFn: (quoteId: string) => QuotesAPI.convertToProject(quoteId),
  onSuccess: (projectId, quoteId) => {
   queryClient.invalidateQueries({ queryKey: ['quotes', quoteId] })
   queryClient.invalidateQueries({ queryKey: ['quotes'] })
   queryClient.invalidateQueries({ queryKey: ['projects'] })
   toast.success('Offert konverterad till projekt!')
   router.push(`/projects/${projectId}`)
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

export function useDuplicateQuote() {
 const queryClient = useQueryClient()
 const router = useRouter()

 return useMutation({
  mutationFn: (quoteId: string) => QuotesAPI.duplicate(quoteId),
  onSuccess: (newQuote) => {
   queryClient.invalidateQueries({ queryKey: ['quotes'] })
   toast.success('Offert duplicerad!')
   router.push(`/quotes/${newQuote.id}/edit`)
  },
  onError: (error: Error) => {
   toast.error(error.message)
  }
 })
}

