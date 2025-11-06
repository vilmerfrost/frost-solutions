'use client';

import { useQuery } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';

interface DashboardAnalytics {
  summary: {
    activeProjects: number;
    totalEmployees: number;
    totalHours: number;
    totalRevenue: number;
    unpaidInvoices: number;
    unpaidAmount: number;
  };
  kpis: {
    budgetVariance: number;
    utilization: number;
    unbilledHours: number;
  };
  projectPerformance: Array<{
    projectId: string;
    name: string;
    spi: number;
    status: string;
  }>;
  period: string;
}

export function useDashboardAnalytics(period: 'week' | 'month' | 'year' = 'month') {
  const { tenantId } = useTenant();

  return useQuery({
    queryKey: ['dashboard-analytics', tenantId, period],
    queryFn: async (): Promise<DashboardAnalytics> => {
      const timestamp = Date.now();
      const response = await fetch(`/api/analytics/dashboard?period=${period}&_t=${timestamp}`, {
        cache: 'no-store', // Analytics ska alltid vara färsk
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Analytics fetch failed:', response.status, errorText);
        throw new Error('Failed to fetch dashboard analytics');
      }

      const result = await response.json();
      console.log('📊 Analytics response:', {
        success: result.success,
        totalHours: result.data?.summary?.totalHours,
        activeProjects: result.data?.summary?.activeProjects,
      });
      
      if (!result.success || !result.data) {
        console.error('❌ Analytics response invalid:', result);
        throw new Error('Invalid analytics response');
      }
      
      return result.data as DashboardAnalytics;
    },
    enabled: !!tenantId,
    staleTime: 0, // Inga cache - alltid fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
}

