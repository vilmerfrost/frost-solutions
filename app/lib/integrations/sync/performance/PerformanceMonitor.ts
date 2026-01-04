// app/lib/integrations/sync/performance/PerformanceMonitor.ts

import { createAdminClient } from '@/utils/supabase/admin';
import type { PerformanceMetrics, AccountingProvider } from '@/types/integrations';

export class PerformanceMonitor {
 private metrics: {
  syncDurations: Map<string, number[]>;
  apiCallCounts: Map<string, number>;
  errors: Map<string, number>;
  startTime: number;
 };
 private supabase: ReturnType<typeof createAdminClient>;

 constructor(supabase: ReturnType<typeof createAdminClient>) {
  this.supabase = supabase;
  this.resetMetrics();
 }

 trackSyncDuration(
  operation: string,
  duration: number,
  provider?: AccountingProvider
 ): void {
  const key = provider ? `${provider}:${operation}` : operation;

  if (!this.metrics.syncDurations.has(key)) {
   this.metrics.syncDurations.set(key, []);
  }

  this.metrics.syncDurations.get(key)!.push(duration);

  // Store in database for historical analysis
  this.storeMetric('sync_duration', {
   operation,
   provider,
   duration,
   timestamp: new Date(),
  });
 }

 trackAPICall(provider: AccountingProvider, endpoint: string): void {
  const key = `${provider}:${endpoint}`;
  const current = this.metrics.apiCallCounts.get(key) || 0;
  this.metrics.apiCallCounts.set(key, current + 1);

  // Track rate limit usage
  this.trackRateLimitUsage(provider);
 }

 trackError(
  operation: string,
  error: Error,
  provider?: AccountingProvider
 ): void {
  const key = provider ? `${provider}:${operation}` : operation;
  const current = this.metrics.errors.get(key) || 0;
  this.metrics.errors.set(key, current + 1);
 }

 getMetrics(): PerformanceMetrics {
  const now = Date.now();
  const runningTime = (now - this.metrics.startTime) / 1000;

  // Calculate average durations
  const syncDurations: Record<string, number> = {};
  this.metrics.syncDurations.forEach((durations, key) => {
   syncDurations[key] =
    durations.reduce((a, b) => a + b, 0) / durations.length;
  });

  // Calculate throughput (operations per second)
  const totalOperations = Array.from(this.metrics.apiCallCounts.values()).reduce(
   (a, b) => a + b,
   0
  );
  const throughput = totalOperations / runningTime;

  // Calculate error rate
  const totalErrors = Array.from(this.metrics.errors.values()).reduce(
   (a, b) => a + b,
   0
  );
  const errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;

  return {
   syncDurations,
   apiCallCounts: Object.fromEntries(this.metrics.apiCallCounts),
   rateLimitUsage: this.calculateRateLimitUsage(),
   queueDepth: this.getQueueDepth(),
   throughput,
   errorRate,
  };
 }

 async getHistoricalMetrics(
  from: Date,
  to: Date,
  provider?: AccountingProvider
 ): Promise<PerformanceMetrics> {
  const { data: metrics } = await this.supabase
   .from('sync_metrics')
   .select('*')
   .gte('created_at', from)
   .lte('created_at', to);

  const filteredMetrics = provider
   ? metrics?.filter((m: any) => m.provider === provider)
   : metrics;

  return this.aggregateHistoricalMetrics(filteredMetrics || []);
 }

 private calculateRateLimitUsage(): Record<string, number> {
  // Implementation to calculate current rate limit usage
  return {
   fortnox: 0.65, // 65% of rate limit used
   visma: 0.42, // 42% of rate limit used
  };
 }

 private getQueueDepth(): number {
  // Get current queue depth from database
  return 0; // Implement based on your queue system
 }

 private async storeMetric(type: string, data: any): Promise<void> {
  await this.supabase.from('sync_metrics').insert([
   {
    type,
    data,
    created_at: new Date(),
   },
  ]);
 }

 private aggregateHistoricalMetrics(metrics: any[]): PerformanceMetrics {
  // Aggregate historical metrics from database
  return {
   syncDurations: {},
   apiCallCounts: {},
   rateLimitUsage: {},
   queueDepth: 0,
   throughput: 0,
   errorRate: 0,
  };
 }

 resetMetrics(): void {
  this.metrics = {
   syncDurations: new Map(),
   apiCallCounts: new Map(),
   errors: new Map(),
   startTime: Date.now(),
  };
 }

 // Alerting for performance degradation
 async checkPerformanceAlerts(): Promise<void> {
  const metrics = this.getMetrics();

  if (metrics.errorRate > 0.1) {
   // 10% error rate
   await this.sendAlert('High error rate detected', metrics);
  }

  if (metrics.throughput < 10) {
   // Less than 10 ops/second
   await this.sendAlert('Low throughput detected', metrics);
  }

  if (metrics.queueDepth > 1000) {
   await this.sendAlert('Queue depth too high', metrics);
  }
 }

 private async sendAlert(
  message: string,
  metrics: PerformanceMetrics
 ): Promise<void> {
  // Implementation for sending alerts (email, Slack, etc.)
  console.warn(`PERFORMANCE ALERT: ${message}`, metrics);
 }
}

