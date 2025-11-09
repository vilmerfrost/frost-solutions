// app/types/integrations.ts

export type AccountingProvider = 'fortnox' | 'visma';

export type IntegrationStatus = 'active' | 'expired' | 'error' | 'pending';

export interface AccountingIntegration {
  id: string;
  tenant_id: string;
  provider: AccountingProvider;
  status: IntegrationStatus;
  access_token_id?: string;  // Reference to Vault
  refresh_token_id?: string; // Reference to Vault
  expires_at?: string;
  scope?: string;
  metadata?: Record<string, any>;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface OAuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

export interface SyncLog {
  id: string;
  tenant_id: string;
  integration_id: string;
  operation: 'sync_invoice' | 'sync_customer' | 'webhook' | 'manual';
  direction: 'push' | 'pull' | 'bidirectional';
  resource_type: 'invoice' | 'customer' | 'product';
  resource_id?: string;
  status: 'success' | 'error' | 'pending';
  error_code?: string;
  error_message?: string;
  duration_ms?: number;
  retry_count: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  revokeUrl?: string;
  apiBaseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  rateLimit: {
    requestsPerMinute: number;
    retryAfter: number;
  };
}

// Sync types (from Gemini 2.5)
export type SyncState = 'pending' | 'processing' | 'completed' | 'failed' | 'requires_manual_resolution';
export type ResolutionStrategy = 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual' | 'last_write_wins' | 'frost_wins' | 'external_wins';

export interface SyncJob {
  id: string;
  tenant_id: string;
  integration_id: string;
  provider: AccountingProvider;
  resource_type: string;
  resource_id: string;
  status: SyncState;
  action: 'sync' | 'delete';
  payload: any;
  strategy: string;
  priority: number;
  retry_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface SyncJobInput {
  tenant_id: string;
  integration_id: string;
  provider: AccountingProvider;
  resource_type: string;
  resource_id: string;
  action?: 'sync' | 'delete';
  payload: any;
  strategy: string;
  priority?: number;
}

export interface Conflict {
  field: string;
  frostValue: any;
  externalValue: any;
  timestamps: {
    frost: Date;
    external: Date;
  };
}

export interface ConflictResolutionResult {
  action: 'use_local' | 'use_remote' | 'merge' | 'skip';
  data?: any;
  reason: string;
}

export interface SyncResult {
  success: boolean;
  externalId?: string;
  error?: string;
  conflicts?: Conflict[];
}

export interface MappedFrostData {
  [key: string]: any;
}

// Performance types (from Deepseek)
export interface BatchSyncResult {
  success: number;
  failed: number;
  total: number;
  duration: number;
  throughput: number; // items per second
  rateLimitUsage: number; // percentage of rate limit used
}

export interface PerformanceMetrics {
  syncDurations: Record<string, number>;
  apiCallCounts: Record<string, number>;
  rateLimitUsage: Record<string, number>;
  queueDepth: number;
  throughput: number;
  errorRate: number;
}
