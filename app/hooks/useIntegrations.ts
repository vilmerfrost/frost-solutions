// app/hooks/useIntegrations.ts
"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import type { Integration, SyncJob, SyncLog, IntegrationStatus, IntegrationStatusResponse } from '@/types/integrations';

// --- Query Keys ---
const getIntegrationsKey = (tenantId: string | null) => ['integrations', tenantId];
const getIntegrationStatusKey = (id: string) => ['integrationStatus', id];
const getSyncJobsKey = (id: string) => ['syncJobs', id];
const getSyncLogsKey = (id: string) => ['syncLogs', id];

/**
 * Hämtar alla integrationer för den nuvarande tenanten
 */
export const useIntegrations = () => {
  const { tenantId } = useTenant();
  
  return useQuery<Integration[]>({
    queryKey: getIntegrationsKey(tenantId),
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      
      const res = await fetch('/api/integrations');
      const data = await res.json();
      
      if (!res.ok) {
        // Om API:et returnerar ett fel-objekt med error property
        const errorMessage = data?.error || data?.message || `HTTP ${res.status}: Failed to fetch integrations`;
        console.error('❌ API error:', {
          status: res.status,
          statusText: res.statusText,
          error: data
        });
        throw new Error(errorMessage);
      }
      
      // Kontrollera om svaret är en array (kan vara tom array om tabellen inte finns)
      if (!Array.isArray(data)) {
        console.warn('⚠️ API returned non-array response:', data);
        // Om det är ett fel-objekt, kasta fel
        if (data?.error) {
          throw new Error(data.error);
        }
        // Annars returnera tom array
        return [];
      }
      
      return data;
    },
    enabled: !!tenantId,
    retry: 1, // Försök bara en gång vid fel
  });
};

/**
 * Hämtar realtidsstatus för en specifik integration
 * 
 * Optimized according to best practices:
 * - 60s staleTime (status changes slowly)
 * - Retry on 503/5xx (service unavailable is retryable)
 * - 60s polling interval (not too aggressive)
 */
export const useIntegrationStatus = (integrationId: string) => {
  const { tenantId } = useTenant();
  
  return useQuery<IntegrationStatusResponse>({
    queryKey: getIntegrationStatusKey(integrationId),
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      
      const res = await fetch(`/api/integrations/${integrationId}/status`, {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!res.ok) {
        let errorMessage = 'Kunde inte hämta status.';
        let status = res.status;
        
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
          // Extract status from error object if available
          if (error.status) status = error.status;
        } catch {
          // Om JSON-parsing misslyckas, använd status text
          errorMessage = res.status === 503 
            ? 'Tjänsten är tillfälligt otillgänglig. Försök igen senare.'
            : `HTTP ${res.status}: ${res.statusText}`;
        }
        
        const e: any = new Error(errorMessage);
        e.status = status;
        throw e;
      }
      
      return res.json();
    },
        enabled: !!tenantId && !!integrationId,
        staleTime: 30_000, // Data is fresh for 30s (reduced for faster updates)
        refetchInterval: 60_000, // Poll every 60 seconds (not too aggressive)
        refetchOnWindowFocus: true, // Refetch when window regains focus
        refetchOnMount: true, // Always refetch on mount
        retry: (failureCount, error: any) => {
          // Don't retry 404 (not found)
          if (error?.status === 404) return false;
          
          // Retry 503 and 5xx errors (service issues are retryable)
          if (error?.status === 503 || (error?.status >= 500 && error?.status < 600)) {
            return failureCount < 3; // Max 3 retries for server errors
          }
          
          // Don't retry other errors (4xx client errors)
          return false;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
      });
    };

/**
 * Hämtar synkroniseringsjobb för en integration
 */
export const useSyncJobs = (integrationId: string) => {
  const { tenantId } = useTenant();
  
  return useQuery<SyncJob[]>({
    queryKey: getSyncJobsKey(integrationId),
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      const res = await fetch(`/api/integrations/${integrationId}/jobs`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch sync jobs');
      }
      return res.json();
    },
    enabled: !!tenantId && !!integrationId,
    refetchInterval: 15000, // Uppdatera jobbkö var 15:e sekund
  });
};

/**
 * Hämtar synkroniseringsloggar för en integration
 */
export const useSyncLogs = (integrationId: string) => {
  const { tenantId } = useTenant();
  
  return useQuery<SyncLog[]>({
    queryKey: getSyncLogsKey(integrationId),
    queryFn: async () => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      const res = await fetch(`/api/integrations/${integrationId}/logs`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to fetch sync logs');
      }
      return res.json();
    },
    enabled: !!tenantId && !!integrationId,
  });
};

// --- Mutations ---

/**
 * Mutation för att starta Fortnox OAuth-flöde
 */
export const useConnectFortnox = () => {
  const { tenantId } = useTenant();
  return useMutation<{ url: string }, Error>({
    mutationFn: async () => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      const res = await fetch('/api/integrations/fortnox/connect', {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to connect');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Omdirigera användaren till Fortnox auktoriseringssida
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(`Anslutning misslyckades: ${extractErrorMessage(error)}`);
    },
  });
};

/**
 * Mutation för att starta Visma OAuth-flöde
 */
export const useConnectVisma = () => {
  const { tenantId } = useTenant();
  return useMutation<{ url: string }, Error, 'visma_eaccounting' | 'visma_payroll'>({
    mutationFn: async (provider) => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      const res = await fetch('/api/integrations/visma/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to connect');
      }
      return res.json();
    },
    onSuccess: (data) => {
      // Omdirigera användaren till Visma auktoriseringssida
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(`Anslutning misslyckades: ${extractErrorMessage(error)}`);
    },
  });
};

/**
 * Mutation för att koppla bort en integration
 */
export const useDisconnectIntegration = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();
  
  return useMutation<void, Error, string>({
    mutationFn: async (integrationId) => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      if (!integrationId || integrationId === 'undefined') {
        throw new Error('Integration ID saknas');
      }
      
      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!res.ok) {
        let errorMessage = 'Failed to disconnect';
        try {
          const error = await res.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }
    },
    onSuccess: async (_, integrationId) => {
      toast.success('Integrationen har kopplats bort');
      
      // Invalidera och refetch alla relaterade queries omedelbart
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getIntegrationsKey(tenantId) }),
        queryClient.invalidateQueries({ queryKey: getIntegrationStatusKey(integrationId) })
      ]);
      
      // Refetch integrations-listan omedelbart för att uppdatera UI
      await queryClient.refetchQueries({ queryKey: getIntegrationsKey(tenantId) });
      
      // Refetch status omedelbart om integrationId är giltigt
      if (integrationId && integrationId !== 'undefined') {
        await queryClient.refetchQueries({ queryKey: getIntegrationStatusKey(integrationId) });
      }
    },
    onError: (error) => {
      toast.error(`Bortkoppling misslyckades: ${extractErrorMessage(error)}`);
    },
  });
};

/**
 * Mutation för att starta en manuell synkronisering
 */
export const useSyncNow = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  return useMutation<void, Error, string>({
    mutationFn: async (integrationId) => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      const res = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_type: 'full_sync', payload: {} }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to start sync');
      }
    },
    onSuccess: (_, integrationId) => {
      toast.success('Synkronisering har startats');
      queryClient.invalidateQueries({ queryKey: getSyncJobsKey(integrationId) });
    },
    onError: (error) => {
      toast.error(`Kunde inte starta synk: ${extractErrorMessage(error)}`);
    },
  });
};

/**
 * Mutation för att exportera en specifik post (faktura/kund)
 */
export const useExportToFortnox = () => {
  const queryClient = useQueryClient();
  const { tenantId } = useTenant();

  type ExportPayload = {
    integrationId: string;
    type: 'invoice' | 'customer';
    id: string; // UUID för fakturan/kunden
  };
  
  return useMutation<void, Error, ExportPayload>({
    mutationFn: async ({ integrationId, type, id }) => {
      if (!tenantId) throw new Error('Tenant ID saknas');
      const res = await fetch(`/api/integrations/${integrationId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to export');
      }
    },
    onSuccess: (_, { type, integrationId }) => {
      toast.success(`${type === 'invoice' ? 'Faktura' : 'Kund'} har köats för export`);
      queryClient.invalidateQueries({ queryKey: getSyncJobsKey(integrationId) });
    },
    onError: (error) => {
      toast.error(`Export misslyckades: ${extractErrorMessage(error)}`);
    },
  });
};

