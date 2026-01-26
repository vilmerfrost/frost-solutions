'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { InvoiceSuggestion } from '@/types/ai';

export interface InvoiceSuggestionResponse {
 suggestion: InvoiceSuggestion;
 model: string;
 cached: boolean;
}

export function useAIInvoiceSuggestion() {
 return useMutation({
  mutationFn: async (projectId: string): Promise<InvoiceSuggestionResponse> => {
   const data = await apiFetch<{
    success?: boolean;
    error?: string;
    suggestion?: InvoiceSuggestion;
    model?: string;
    cached?: boolean;
   }>('/api/ai/suggest-invoice', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
   });

   if (!data.success) {
    throw new Error(data.error || 'Kunde inte generera förslag');
   }

   return {
    suggestion: data.suggestion as InvoiceSuggestion,
    model: data.model || 'claude-haiku',
    cached: data.cached || false,
   };
  },
  onError: (error: Error) => {
   const message = extractErrorMessage(error);
   toast.error(`Kunde inte generera förslag: ${message}`);
  },
 });
}

