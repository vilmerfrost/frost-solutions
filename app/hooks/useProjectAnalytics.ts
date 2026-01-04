'use client';

import { useQuery } from '@tanstack/react-query';

interface ProjectAnalytics {
 project: {
  id: string;
  name: string;
  status: string;
 };
 metrics: {
  actualHours: number;
  plannedHours: number;
  actualCost: number;
  plannedValue: number;
  revenue: number;
 };
 kpis: {
  spi: number; // Schedule Performance Index
  cpi: number; // Cost Performance Index
  budgetVariance: number;
  profitability: number;
 };
 status: {
  onSchedule: boolean;
  onBudget: boolean;
  profitable: boolean;
 };
}

export function useProjectAnalytics(projectId: string) {
 return useQuery({
  queryKey: ['project-analytics', projectId],
  queryFn: async (): Promise<ProjectAnalytics> => {
   const response = await fetch(`/api/projects/${projectId}/analytics?_t=${Date.now()}`, {
    cache: 'no-store',
   });

   if (!response.ok) {
    throw new Error('Failed to fetch project analytics');
   }

   const result = await response.json();
   return result.data as ProjectAnalytics;
  },
  enabled: !!projectId,
  staleTime: 0, // Inga cache - alltid fresh data
  refetchOnWindowFocus: true,
  refetchOnMount: true,
 });
}

