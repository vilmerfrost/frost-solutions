// app/lib/performance/useMemoizedCallback.ts

/**
 * Memoized Callback Hook
 * Based on Deepseek implementation
 */

import { useCallback, useRef } from 'react';

/**
 * Returns a memoized callback that only changes if dependencies change
 * Optimized version of useCallback with better performance
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
 callback: T,
 deps: React.DependencyList
): T {
 const callbackRef = useRef(callback);
 callbackRef.current = callback;

 return useCallback(
  ((...args: Parameters<T>) => {
   return callbackRef.current(...args);
  }) as T,
  deps
 );
}

