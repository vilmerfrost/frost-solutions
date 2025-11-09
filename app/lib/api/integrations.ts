// app/lib/api/integrations.ts

import { extractErrorMessage } from '@/lib/errorUtils';
import type {
  AccountingIntegration,
  AccountingProvider,
  SyncLog,
} from '@/types/integrations';

export interface IntegrationStatusResponse {
  success: boolean;
  integrations?: AccountingIntegration[];
  recentLogs?: SyncLog[];
  stats?: {
    total: number;
    success: number;
    error: number;
    pending: number;
  };
  error?: string;
}

export interface SyncInvoiceResponse {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface SyncCustomerResponse {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface AnalyticsResponse {
  success: boolean;
  timeline?: Array<{
    date: string;
    success: number;
    error: number;
    total: number;
    avgDuration: number;
    successRate: number;
  }>;
  operationBreakdown?: Array<{
    operation: string;
    success: number;
    error: number;
    total: number;
    successRate: number;
  }>;
  providerBreakdown?: Array<{
    provider: string;
    success: number;
    error: number;
    total: number;
    successRate: number;
  }>;
  resourceBreakdown?: Array<{
    resourceType: string;
    success: number;
    error: number;
    total: number;
    successRate: number;
  }>;
  overall?: {
    total: number;
    success: number;
    error: number;
    successRate: number;
    avgDuration: number;
  };
  error?: string;
}

/**
 * IntegrationAPI: Frontend client for integration endpoints
 */
export class IntegrationAPI {
  /**
   * Get integration status and recent sync logs
   */
  static async getStatus(): Promise<IntegrationStatusResponse> {
    console.log('[IntegrationAPI] 📊 Fetching status...');
    try {
      const response = await fetch('/api/integrations/status', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[IntegrationAPI] ✅ Status fetched:', {
        integrations: result.integrations?.length,
        logs: result.recentLogs?.length,
      });
      return result;
    } catch (error: any) {
      console.error('[IntegrationAPI] ❌ Failed to fetch status:', error);
      throw error;
    }
  }

  /**
   * Start OAuth flow for provider
   * This redirects the browser, so no return value
   */
  static startOAuthFlow(provider: AccountingProvider): void {
    console.log('[IntegrationAPI] 🔐 Starting OAuth flow:', provider);
    window.location.href = `/api/integrations/authorize/${provider}`;
  }

  /**
   * Sync invoice to accounting system
   */
  static async syncInvoice(
    invoiceId: string,
    provider: AccountingProvider
  ): Promise<SyncInvoiceResponse> {
    console.log('[IntegrationAPI] 📤 Syncing invoice:', {
      invoiceId,
      provider,
    });
    try {
      const response = await fetch('/api/integrations/sync-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ invoiceId, provider }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('[IntegrationAPI] ✅ Invoice synced:', result.externalId);
      return result;
    } catch (error: any) {
      console.error('[IntegrationAPI] ❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync customer to accounting system
   */
  static async syncCustomer(
    clientId: string,
    provider: AccountingProvider
  ): Promise<SyncCustomerResponse> {
    console.log('[IntegrationAPI] 📤 Syncing customer:', {
      clientId,
      provider,
    });
    try {
      const response = await fetch('/api/integrations/sync-customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ clientId, provider }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      console.log('[IntegrationAPI] ✅ Customer synced:', result.externalId);
      return result;
    } catch (error: any) {
      console.error('[IntegrationAPI] ❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Disconnect integration
   */
  static async disconnect(provider: AccountingProvider): Promise<void> {
    console.log('[IntegrationAPI] 🔌 Disconnecting:', provider);
    try {
      const response = await fetch(`/api/integrations/disconnect/${provider}`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      console.log('[IntegrationAPI] ✅ Disconnected');
    } catch (error: any) {
      console.error('[IntegrationAPI] ❌ Disconnect failed:', error);
      throw error;
    }
  }

  /**
   * Get analytics data for sync operations
   */
  static async getAnalytics(days: number = 30): Promise<AnalyticsResponse> {
    console.log('[IntegrationAPI] 📊 Fetching analytics...');
    try {
      const response = await fetch(`/api/integrations/analytics?days=${days}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('[IntegrationAPI] ✅ Analytics fetched:', {
        timeline: result.timeline?.length,
        operations: result.operationBreakdown?.length,
      });
      return result;
    } catch (error: any) {
      console.error('[IntegrationAPI] ❌ Failed to fetch analytics:', error);
      throw error;
    }
  }
}

