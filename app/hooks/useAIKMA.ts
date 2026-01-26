'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { KmaItem } from '@/types/ai';

export interface KmaChecklist {
 items: KmaItem[];
 projectType: string;
 confidence: 'high' | 'medium' | 'low';
}

export function useAIKMA() {
 return useMutation({
  mutationFn: async (projectType: string): Promise<KmaChecklist> => {
   const data = await apiFetch<{
    success?: boolean;
    error?: string;
    checklist?: KmaChecklist;
   }>('/api/ai/suggest-kma-checklist', {
    method: 'POST',
    body: JSON.stringify({ projectType }),
   });

   if (!data.success) {
    throw new Error(data.error || 'Kunde inte generera checklista');
   }

   return data.checklist as KmaChecklist;
  },
  onError: (error: Error) => {
   toast.error(`Kunde inte generera förslag: ${extractErrorMessage(error)}`);
  },
 });
}

