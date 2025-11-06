'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { ProjectPlan } from '@/types/ai';

export interface ProjectPlanResponse {
  plan: ProjectPlan;
  model: string;
  cached: boolean;
}

export function useAIProjectPlan() {
  return useMutation({
    mutationFn: async (projectId: string): Promise<ProjectPlanResponse> => {
      const response = await fetch('/api/ai/suggest-project-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Okänt fel' }));
        throw new Error(errorData.error || 'Kunde inte generera plan');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Kunde inte generera plan');
      }

      return {
        plan: data.plan as ProjectPlan,
        model: data.model || 'claude-haiku',
        cached: data.cached || false,
      };
    },
    onError: (error: Error) => {
      toast.error(`Planering misslyckades: ${extractErrorMessage(error)}`);
    },
  });
}

