// app/lib/queryClient.ts
'use client'

import { QueryClient } from '@tanstack/react-query'

/**
 * React Query client configuration - Optimized for Performance
 * 
 * Settings optimized for responsiveness:
 * - staleTime: 2 minutes default - Balance between freshness and performance
 * - gcTime: 24 hours - Data stays in cache for 24 hours
 * - refetchOnWindowFocus: false - Reduce unnecessary requests
 * - refetchOnReconnect: true - Fetch fresh data when back online
 * 
 * Individual hooks can override these settings for specific needs:
 * - Static data (employees, clients): longer staleTime (10 min)
 * - Dynamic data (invoices, time entries): shorter staleTime (30 sec - 2 min)
 * - Real-time data (dashboard): staleTime 0 with refetchInterval
 */
export const queryClient = new QueryClient({
 defaultOptions: {
  queries: {
   // Default: 2 minutes stale time for good balance
   staleTime: 1000 * 60 * 2,
   // Keep data in cache for 24 hours
   gcTime: 1000 * 60 * 60 * 24,
   // Don't refetch on window focus by default (reduces API calls)
   refetchOnWindowFocus: false,
   // Do refetch when coming back online
   refetchOnReconnect: true,
   // Always try network first
   networkMode: 'always',
   // Smart retry logic
   retry: (failureCount, error: any) => {
    // Don't retry if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
     return false;
    }
    // Don't retry on 401/403/404
    const status = (error as any)?.status || (error as any)?.response?.status;
    if (status === 401 || status === 403 || status === 404) {
     return false;
    }
    // Max 2 retries (faster failure)
    return failureCount < 2;
   },
   retryDelay: (attemptIndex) => {
    // Exponential backoff: 500ms, 1s (faster retry)
    return Math.min(500 * 2 ** attemptIndex, 5000);
   }
  },
  mutations: {
   networkMode: 'always',
   retry: 1,
   retryDelay: 500,
  },
 },
})

/**
 * Predefined staleTime constants for consistency
 * Use these in individual hooks for appropriate data types
 */
export const STALE_TIMES = {
  // Static data that rarely changes
  STATIC: 1000 * 60 * 10, // 10 minutes (employees, clients, plans)
  // Semi-dynamic data
  NORMAL: 1000 * 60 * 2, // 2 minutes (projects, invoices)
  // Dynamic data that changes often
  DYNAMIC: 1000 * 30, // 30 seconds (time entries, notifications)
  // Real-time data (use with refetchInterval)
  REALTIME: 0, // Always stale (dashboard analytics)
} as const;

