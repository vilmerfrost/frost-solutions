// app/lib/queryClient.ts
'use client'

import { QueryClient } from '@tanstack/react-query'

/**
 * React Query client configuration - Offline-First
 * 
 * Settings:
 * - staleTime: Infinity - Data never becomes stale (offline-first)
 * - networkMode: 'offline-first' - Read from cache first, then network
 * - gcTime: 24 hours - Data stays in cache for 24 hours
 * - refetchOnWindowFocus: false - Don't refetch when switching tabs
 */
export const queryClient = new QueryClient({
 defaultOptions: {
  queries: {
   staleTime: Infinity,
   gcTime: 1000 * 60 * 60 * 24,
   refetchOnWindowFocus: true,
   refetchOnReconnect: true,
   networkMode: 'always',
   retry: (failureCount, error: any) => {
    // Don't retry if offline
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
     return false;
    }
    // Max 3 retries
    return failureCount < 3;
   },
   retryDelay: (attemptIndex) => {
    // Exponential backoff: 1s, 2s, 4s
    return Math.min(1000 * 2 ** attemptIndex, 30000);
   }
  },
  mutations: {
   networkMode: 'always',
   retry: 1,
   retryDelay: (attemptIndex) => {
    return Math.min(1000 * 2 ** attemptIndex, 30000);
   }
  },
 },
})

