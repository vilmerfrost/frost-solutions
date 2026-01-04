// app/hooks/useQuoteTemplates.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { TemplatesAPI } from '@/lib/api/quotes'

export function useQuoteTemplates() {
 return useQuery({
  queryKey: ['quote-templates'],
  queryFn: () => TemplatesAPI.list()
 })
}

export function useQuoteTemplate(id: string | null) {
 return useQuery({
  queryKey: ['quote-templates', id],
  queryFn: () => TemplatesAPI.get(id!),
  enabled: !!id
 })
}

