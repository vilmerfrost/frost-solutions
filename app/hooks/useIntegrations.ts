// app/hooks/useIntegrations.ts

'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IntegrationAPI } from '@/lib/api/integrations';
import { toast } from '@/lib/toast';
import type { AccountingProvider } from '@/types/integrations';

/**
 * Fetch integration status and sync logs
 * Polls every 30 seconds for real-time updates
 */
export function useIntegrationStatus() {
 return useQuery({
  queryKey: ['integrations', 'status'],
  queryFn: () => IntegrationAPI.getStatus(),
  staleTime: 1000 * 30, // 30 seconds
  refetchInterval: 1000 * 30, // Poll every 30 seconds
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
 });
}

/**
 * Convenience hook that only returns the integrations array
 */
export function useIntegrations() {
 const statusQuery = useIntegrationStatus();
 return {
  ...statusQuery,
  data: statusQuery.data?.integrations ?? [],
 };
}

/**
 * Start OAuth connection flow
 * This triggers a browser redirect
 */
export function useConnectIntegration() {
 return useMutation({
  mutationFn: (provider: AccountingProvider) => {
   console.log('[useConnectIntegration] 🔐 Starting OAuth for:', provider);
   IntegrationAPI.startOAuthFlow(provider);
   // No return value - browser will redirect
   return Promise.resolve();
  },
  onError: (error: Error) => {
   console.error('[useConnectIntegration] ❌ Failed:', error);
   toast.error(`Kunde inte ansluta: ${error.message}`);
  },
 });
}

type ExportPayload =
 | {
   integrationId: string;
   type: 'invoice' | 'customer';
   id: string;
  }
 | {
   integrationId: string;
   type: 'payroll';
   month: string;
  };

/**
 * Export data/jobs to Fortnox/Visma via integration jobs
 */
export function useExportToFortnox() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: async (payload: ExportPayload) => {
   const { integrationId, type } = payload;
   const url =
    type === 'payroll'
     ? `/api/integrations/${integrationId}/export-payroll`
     : `/api/integrations/${integrationId}/export`;

   const body =
    type === 'payroll'
     ? { month: payload.month }
     : { type, id: payload.id };

   const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
   });

   const result = await response.json().catch(() => ({}));
   if (!response.ok) {
    throw new Error(result.error || 'Export misslyckades');
   }

   return result;
  },
  onSuccess: (_, variables) => {
   toast.success(
    'Export köad!',
    variables.type === 'payroll'
     ? `Lönespec ${variables.month} skickas till Fortnox/Visma`
     : `Typ: ${variables.type}`
   );
   queryClient.invalidateQueries({ queryKey: ['integration_jobs'] });
  },
  onError: (error: Error) => {
   toast.error('Export misslyckades', error.message);
  },
 });
}

/**
 * Disconnect integration
 */
export function useDisconnectIntegration() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: (provider: AccountingProvider) => {
   console.log('[useDisconnectIntegration] 🔌 Disconnecting:', provider);
   return IntegrationAPI.disconnect(provider);
  },
  onSuccess: () => {
   console.log('[useDisconnectIntegration] ✅ Success');
   queryClient.invalidateQueries({ queryKey: ['integrations'] });
   toast.success('Integration frånkopplad');
  },
  onError: (error: Error) => {
   console.error('[useDisconnectIntegration] ❌ Failed:', error);
   toast.error(`Kunde inte koppla från: ${error.message}`);
  },
 });
}

/**
 * Sync invoice to accounting system
 */
export function useSyncInvoice() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: ({
   invoiceId,
   provider,
  }: {
   invoiceId: string;
   provider: AccountingProvider;
  }) => {
   console.log('[useSyncInvoice] 📤 Syncing invoice:', {
    invoiceId,
    provider,
   });
   return IntegrationAPI.syncInvoice(invoiceId, provider);
  },
  onSuccess: (result, variables) => {
   console.log('[useSyncInvoice] ✅ Success:', result.externalId);

   // Invalidate queries to refresh data
   queryClient.invalidateQueries({ queryKey: ['integrations'] });
   queryClient.invalidateQueries({ queryKey: ['invoices'] });
   toast.success('Faktura synkad!', result.externalId ? `ID: ${result.externalId}` : undefined);
  },
  onError: (error: Error, variables) => {
   console.error('[useSyncInvoice] ❌ Failed:', error);
   toast.error('Synkronisering misslyckades', error.message);
  },
 });
}

/**
 * Sync customer to accounting system
 */
export function useSyncCustomer() {
 const queryClient = useQueryClient();
 return useMutation({
  mutationFn: ({
   clientId,
   provider,
  }: {
   clientId: string;
   provider: AccountingProvider;
  }) => {
   console.log('[useSyncCustomer] 📤 Syncing customer:', {
    clientId,
    provider,
   });
   return IntegrationAPI.syncCustomer(clientId, provider);
  },
  onSuccess: (result) => {
   console.log('[useSyncCustomer] ✅ Success:', result.externalId);

   queryClient.invalidateQueries({ queryKey: ['integrations'] });
   queryClient.invalidateQueries({ queryKey: ['clients'] });
   toast.success('Kund synkad!', result.externalId ? `ID: ${result.externalId}` : undefined);
  },
  onError: (error: Error) => {
   console.error('[useSyncCustomer] ❌ Failed:', error);
   toast.error('Synkronisering misslyckades', error.message);
  },
 });
}

/**
 * Smart polling hook that pauses when tab is inactive
 * From Copilot Pro's implementation
 */
export function useSyncStatusWithPolling(enabled: boolean = true) {
 const [isTabActive, setIsTabActive] = React.useState(true);

 React.useEffect(() => {
  const handleVisibilityChange = () => {
   setIsTabActive(!document.hidden);
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () =>
   document.removeEventListener('visibilitychange', handleVisibilityChange);
 }, []);

 return useQuery({
  queryKey: ['integrations', 'status'],
  queryFn: () => IntegrationAPI.getStatus(),
  enabled: enabled && isTabActive,
  refetchInterval: isTabActive ? 30000 : false,
  refetchIntervalInBackground: false,
  staleTime: 1000 * 30,
  retry: 3,
 });
}

/**
 * Fetch analytics data for sync operations
 */
export function useIntegrationAnalytics(days: number = 30) {
 return useQuery({
  queryKey: ['integrations', 'analytics', days],
  queryFn: () => IntegrationAPI.getAnalytics(days),
  staleTime: 1000 * 60, // 1 minute
  refetchInterval: 1000 * 60 * 5, // 5 minutes
  retry: 2,
 });
}
