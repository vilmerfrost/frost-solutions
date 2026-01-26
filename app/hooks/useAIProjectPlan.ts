'use client';

import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
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
   const data = await apiFetch<{
    success?: boolean;
    error?: string;
    plan?: ProjectPlan;
    model?: string;
    cached?: boolean;
   }>('/api/ai/suggest-project-plan', {
    method: 'POST',
    body: JSON.stringify({ projectId }),
   });

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

