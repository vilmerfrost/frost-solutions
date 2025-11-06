'use client';

import { useMutation } from '@tanstack/react-query';
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
      const response = await fetch('/api/ai/suggest-kma-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt serverfel' }));
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Kunde inte generera checklista');
      }

      return data.checklist;
    },
    onError: (error: Error) => {
      toast.error(`Kunde inte generera förslag: ${extractErrorMessage(error)}`);
    },
  });
}

