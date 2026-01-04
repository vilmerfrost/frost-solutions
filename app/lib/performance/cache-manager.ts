// app/lib/performance/cache-manager.ts
import { createLogger } from '@/lib/utils/logger';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('CacheManager');

interface CacheEntry<T> {
 key: string;
 data: T;
 expiry: number;
}

/**
 * In-memory cache with TTL for performance optimization
 */
export class CacheManager {
 private cache: Map<string, CacheEntry<unknown>> = new Map();
 private readonly defaultTTL: number;

 constructor(defaultTTL: number = 5 * 60 * 1000) {
  // 5 minutes default
  this.defaultTTL = defaultTTL;

  // Cleanup expired entries every minute
  setInterval(() => this.cleanup(), 60 * 1000);
 }

 /**
  * Get cached value
  */
 get<T>(key: string): T | null {
  const entry = this.cache.get(key);

  if (!entry) {
   return null;
  }

  if (Date.now() > entry.expiry) {
   this.cache.delete(key);
   return null;
  }

  return entry.data as T;
 }

 /**
  * Set cached value
  */
 set<T>(key: string, data: T, ttl?: number): void {
  const expiry = Date.now() + (ttl || this.defaultTTL);

  this.cache.set(key, {
   key,
   data,
   expiry,
  });
 }

 /**
  * Invalidate cache entry
  */
 invalidate(key: string): void {
  this.cache.delete(key);
 }

 /**
  * Invalidate all entries matching pattern
  */
 invalidatePattern(pattern: string): void {
  const regex = new RegExp(pattern);
  for (const key of this.cache.keys()) {
   if (regex.test(key)) {
    this.cache.delete(key);
   }
  }
 }

 /**
  * Clear all cache
  */
 clear(): void {
  this.cache.clear();
 }

 /**
  * Cleanup expired entries
  */
 private cleanup(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of this.cache.entries()) {
   if (now > entry.expiry) {
    this.cache.delete(key);
    cleaned++;
   }
  }

  if (cleaned > 0) {
   logger.debug(`Cleaned ${cleaned} expired cache entries`);
  }
 }

 /**
  * Get cache statistics
  */
 getStats(): {
  size: number;
  keys: string[];
 } {
  return {
   size: this.cache.size,
   keys: Array.from(this.cache.keys()),
  };
 }
}

/**
 * Global cache instance
 */
export const globalCache = new CacheManager(5 * 60 * 1000);

