'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { BudgetPrediction } from '@/types/ai';

export function useAIBudgetPrediction() {
 return useMutation({
  mutationFn: async (projectId: string): Promise<BudgetPrediction> => {
   const data = await apiFetch<{
    success?: boolean;
    error?: string;
    prediction?: BudgetPrediction;
   }>('/api/ai/predict-budget', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
   });

   if (!data.success) {
    throw new Error(data.error || 'Kunde inte hämta prognos');
   }

   return data.prediction as BudgetPrediction;
  },
  onError: (error: Error) => {
   toast.error(`Prognos misslyckades: ${extractErrorMessage(error)}`);
  },
 });
}

