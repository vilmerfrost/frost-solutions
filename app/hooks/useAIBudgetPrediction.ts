'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { BudgetPrediction } from '@/types/ai';

export function useAIBudgetPrediction() {
  return useMutation({
    mutationFn: async (projectId: string): Promise<BudgetPrediction> => {
      const response = await fetch('/api/ai/predict-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt serverfel' }));
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Kunde inte hämta prognos');
      }

      return data.prediction;
    },
    onError: (error: Error) => {
      toast.error(`Prognos misslyckades: ${extractErrorMessage(error)}`);
    },
  });
}

