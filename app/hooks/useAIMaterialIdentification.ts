'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { MaterialResult } from '@/types/ai';

export function useAIMaterialIdentification() {
 return useMutation({
  mutationFn: async (imageBase64: string): Promise<MaterialResult> => {
   const response = await fetch('/api/ai/identify-material', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 }),
   });

   if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Okänt serverfel' }));
    throw new Error(errorData.error || response.statusText);
   }

   const data = await response.json();
   if (!data.success) {
    throw new Error(data.error || 'Kunde inte identifiera material');
   }

   return data.material;
  },
  onError: (error: Error) => {
   toast.error(`Identifiering misslyckades: ${extractErrorMessage(error)}`);
  },
 });
}

