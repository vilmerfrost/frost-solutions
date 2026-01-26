'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';
import { useEffect } from 'react';
import { BASE_PATH } from '@/utils/url';

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
 const queryClient = useQueryClient();

 // Listen for time entry updates
 useEffect(() => {
  const handleUpdate = () => {
   console.log('🔔 [Analytics Hook] Time entry updated, invalidating queries...');
   queryClient.invalidateQueries({ queryKey: ['dashboard-analytics'] });
  };

  window.addEventListener('timeEntryUpdated', handleUpdate);

  return () => {
   window.removeEventListener('timeEntryUpdated', handleUpdate);
  };
 }, [queryClient]);

 return useQuery({
  queryKey: ['dashboard-analytics', tenantId, period],
  queryFn: async (): Promise<DashboardAnalytics> => {
   const cacheKey = tenantId
    ? `dashboard-analytics:${tenantId}:${period}`
    : `dashboard-analytics:anon:${period}`;

   if (typeof window !== 'undefined' && !navigator.onLine) {
    const cached = window.localStorage.getItem(cacheKey);
    if (cached) {
     try {
      const parsed = JSON.parse(cached) as { data: DashboardAnalytics };
      console.log('📴 Offline - using cached analytics');
      return parsed.data;
     } catch (err) {
      console.warn('⚠️ Failed to parse cached analytics:', err);
     }
    }
    throw new Error('offline');
   }

   const timestamp = Date.now();
   const response = await fetch(`${BASE_PATH}/api/analytics/dashboard?period=${period}&_t=${timestamp}`, {
    cache: 'no-store', // Analytics ska alltid vara färsk
    headers: {
     'Cache-Control': 'no-cache, no-store, must-revalidate',
     'Pragma': 'no-cache',
     ...(tenantId ? { 'x-tenant-id': tenantId } : {}),
    },
    credentials: 'include',
   });

   if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Analytics fetch failed:', response.status, errorText);

    let parsedError: any;
    try {
     parsedError = JSON.parse(errorText);
    } catch {
     parsedError = { error: errorText };
    }

    if (response.status === 401) {
     throw new Error('unauthorized');
    }

    if (
     response.status === 503 &&
     typeof window !== 'undefined' &&
     (parsedError?.error?.includes('Offline') || parsedError?.error?.includes('offline'))
    ) {
     const cached = window.localStorage.getItem(cacheKey);
     if (cached) {
      try {
       const parsed = JSON.parse(cached) as { data: DashboardAnalytics };
       console.warn('📴 503 offline - falling back to cached analytics data');
       return parsed.data;
      } catch (err) {
       console.warn('⚠️ Failed to parse cached analytics during 503 fallback:', err);
      }
     }
    }

    throw new Error(parsedError?.error || 'Failed to fetch dashboard analytics');
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
   
   if (typeof window !== 'undefined') {
    try {
     window.localStorage.setItem(
      cacheKey,
      JSON.stringify({ data: result.data, timestamp: Date.now() })
     );
    } catch (err) {
     console.warn('⚠️ Failed to cache analytics data:', err);
    }
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

