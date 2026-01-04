// app/lib/performance/usePerformance.ts

/**
 * Performance Monitoring Hook
 * Based on Deepseek implementation
 */

'use client';

import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
 renderTime: number;
 componentName: string;
 timestamp: number;
}

/**
 * Hook to measure component render performance
 */
export function usePerformance(componentName: string, enabled: boolean = true) {
 const renderStartRef = useRef<number>(0);
 const renderCountRef = useRef<number>(0);

 useEffect(() => {
  if (!enabled || process.env.NODE_ENV !== 'development') return;

  renderStartRef.current = performance.now();
  renderCountRef.current += 1;

  return () => {
   const renderTime = performance.now() - renderStartRef.current;
   
   if (renderTime > 16) { // Warn if render takes longer than one frame (16ms)
    console.warn(`[Performance] ${componentName} render took ${renderTime.toFixed(2)}ms (render #${renderCountRef.current})`);
   }

   // Log to performance API if available
   if ('performance' in window && 'mark' in performance) {
    performance.mark(`${componentName}-render-end`);
    performance.measure(
     `${componentName}-render`,
     `${componentName}-render-start`,
     `${componentName}-render-end`
    );
   }
  };
 });

 useEffect(() => {
  if (!enabled || process.env.NODE_ENV !== 'development') return;
  
  if ('performance' in window && 'mark' in performance) {
   performance.mark(`${componentName}-render-start`);
  }
 }, [componentName, enabled]);
}

/**
 * Measure async operation performance
 */
export async function measureAsync<T>(
 name: string,
 operation: () => Promise<T>
): Promise<T> {
 const start = performance.now();
 
 try {
  const result = await operation();
  const duration = performance.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
   console.log(`[Performance] ${name} took ${duration.toFixed(2)}ms`);
  }
  
  return result;
 } catch (error) {
  const duration = performance.now() - start;
  console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms:`, error);
  throw error;
 }
}

