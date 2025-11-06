// app/components/integrations/IntegrationStatusCard.tsx
"use client";

import React from 'react';
import type { Integration } from '@/types/integrations';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { useDisconnectIntegration, useSyncNow } from '@/hooks/useIntegrations';
import { FortnoxConnectButton } from './FortnoxConnectButton';
import { VismaConnectButton } from './VismaConnectButton';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Power, PowerOff } from 'lucide-react';

// Status Badge Helper
const StatusBadge = ({ status }: { status: Integration['status'] }) => {
  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        <CheckCircle className="w-4 h-4" /> Ansluten
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
        <XCircle className="w-4 h-4" /> Fel
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
      <PowerOff className="w-4 h-4" /> Frånkopplad
    </span>
  );
};

// Helper för att få provider-namn och ikon
const getProviderInfo = (provider: Integration['provider']) => {
  switch (provider) {
    case 'fortnox':
      return {
        name: 'Fortnox',
        icon: 'F',
        gradient: 'from-blue-500 to-purple-600',
        connectButton: <FortnoxConnectButton />
      };
    case 'visma_eaccounting':
      return {
        name: 'Visma eAccounting',
        icon: 'VE',
        gradient: 'from-green-500 to-teal-600',
        connectButton: <VismaConnectButton provider="visma_eaccounting" />
      };
    case 'visma_payroll':
      return {
        name: 'Visma Payroll',
        icon: 'VP',
        gradient: 'from-green-500 to-teal-600',
        connectButton: <VismaConnectButton provider="visma_payroll" />
      };
    default:
      return {
        name: 'Integration',
        icon: '?',
        gradient: 'from-gray-500 to-gray-600',
        connectButton: null
      };
  }
};

export function IntegrationStatusCard({ integration }: { integration: Integration }) {
  const { data, isLoading, isError, error, refetch } = useIntegrationStatus(integration.id);
  const disconnectMutation = useDisconnectIntegration();
  const syncNowMutation = useSyncNow();

  // Använd färsk data om den finns, annars fallback till prop
  // Prioritera data från status-query (mer uppdaterad) men fallback till integration prop
  const currentStatus = data?.status ?? integration.status;
  const lastError = data?.last_error ?? integration.last_error;
  const lastSync = data?.last_synced_at ?? integration.last_synced_at;
  const stats = data?.statistics || {};
  const providerInfo = getProviderInfo(integration.provider);
  
  // Om status-hämtningen misslyckades, visa varning men använd integration-data
  const statusError = isError && error instanceof Error ? error.message : null;
  
  // Refetch status när integration prop ändras (t.ex. efter disconnect)
  React.useEffect(() => {
    if (integration.id) {
      refetch();
    }
  }, [integration.status, integration.id, refetch]);

  const handleDisconnect = () => {
    if (!integration?.id) {
      console.error('❌ Cannot disconnect: integration.id is missing', integration);
      return;
    }
    
    if (window.confirm(`Är du säker på att du vill koppla bort ${providerInfo.name}?`)) {
      disconnectMutation.mutate(integration.id);
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 bg-gradient-to-br ${providerInfo.gradient} rounded-lg flex items-center justify-center text-white font-bold text-xl`}>
              {providerInfo.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{providerInfo.name}</h2>
              <StatusBadge status={currentStatus} />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex-shrink-0">
            {currentStatus === 'disconnected' && providerInfo.connectButton}
            {currentStatus === 'connected' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => syncNowMutation.mutate(integration.id)}
                  disabled={syncNowMutation.isPending || isLoading}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 min-h-[44px] disabled:opacity-70"
                >
                  {syncNowMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Synka nu
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 min-h-[44px] disabled:opacity-70"
                >
                  {disconnectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                  Koppla från
                </button>
              </div>
            )}
            {currentStatus === 'error' && (
              <button
                onClick={handleDisconnect}
                disabled={disconnectMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 min-h-[44px] disabled:opacity-70"
              >
                {disconnectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                Koppla från
              </button>
            )}
          </div>
        </div>

        {/* Status-hämtningsfel (503, timeout, etc.) */}
        {statusError && (
          <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">Kunde inte hämta status</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300">{statusError}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Visar senast sparad status. Försök uppdatera sidan om problemet kvarstår.
              </p>
            </div>
          </div>
        )}
        
        {/* Integration-felmeddelande */}
        {currentStatus === 'error' && lastError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 dark:text-red-200">Ett fel har inträffat</h4>
              <p className="text-sm text-red-700 dark:text-red-300">{lastError}</p>
              
              {/* Visa extra information för error_missing_license */}
              {(lastError.includes('saknar licens') || lastError.includes('missing_license')) && (
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-2">
                    ℹ️ Detta är INTE ett fel i appen
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    Gratis Fortnox-konton saknar API-åtkomst. Kunder med betalda Fortnox-paket (Fakturering, Bokföring eller högre) kommer att kunna ansluta utan problem.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Statistik-footer (visas bara om ansluten) */}
      {currentStatus === 'connected' && (
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Senaste Synk</span>
              <p className="text-sm font-semibold dark:text-white">
                {lastSync ? new Date(lastSync).toLocaleString('sv-SE') : 'Aldrig'}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Kunder</span>
              <p className="text-sm font-semibold dark:text-white">{stats.customers || 0}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Fakturor</span>
              <p className="text-sm font-semibold dark:text-white">{stats.invoices || 0}</p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Totalt</span>
              <p className="text-sm font-semibold dark:text-white">{(stats.customers || 0) + (stats.invoices || 0)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

