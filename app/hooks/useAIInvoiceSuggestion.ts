'use client';

import { useMutation } from '@tanstack/react-query';
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
      const response = await fetch('/api/ai/suggest-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }));
        throw new Error(errorData.error || 'Kunde inte generera förslag');
      }

      const data = await response.json();
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

