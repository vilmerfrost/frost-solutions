// app/types/integrations.ts

export type IntegrationProvider = 'fortnox' | 'visma_eaccounting' | 'visma_payroll';

export type IntegrationStatus = 'disconnected' | 'connected' | 'error' | 'misconfigured' | 'loading';

export type SyncJobStatus = 'queued' | 'running' | 'success' | 'failed' | 'retry';

export type SyncLogLevel = 'info' | 'warn' | 'error';

export interface Integration {
  id: string;
  tenant_id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  client_id: string;
  scope: string | null;
  last_error: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationStatusResponse {
  id: string;
  provider: IntegrationProvider;
  status: IntegrationStatus;
  last_synced_at: string | null;
  last_error: string | null;
  updated_at: string;
  statistics?: {
    customers?: number;
    invoices?: number;
    articles?: number;
    offers?: number;
    employees?: number;
    projects?: number;
  };
}

export interface SyncJob {
  id: string;
  tenant_id: string;
  integration_id: string;
  job_type: string;
  payload: Record<string, any>;
  status: SyncJobStatus;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_at: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  tenant_id: string;
  integration_id: string | null;
  level: SyncLogLevel;
  message: string;
  context: Record<string, any>;
  created_at: string;
}

