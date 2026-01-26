'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { MaterialResult } from '@/types/ai';

export function useAIMaterialIdentification() {
 return useMutation({
  mutationFn: async (imageBase64: string): Promise<MaterialResult> => {
   const data = await apiFetch<{
    success?: boolean;
    error?: string;
    material?: MaterialResult;
   }>('/api/ai/identify-material', {
    method: 'POST',
    body: JSON.stringify({ imageBase64 }),
   });

   if (!data.success) {
    throw new Error(data.error || 'Kunde inte identifiera material');
   }

   return data.material as MaterialResult;
  },
  onError: (error: Error) => {
   toast.error(`Identifiering misslyckades: ${extractErrorMessage(error)}`);
  },
 });
}

