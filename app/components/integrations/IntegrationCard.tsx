// app/components/integrations/IntegrationCard.tsx
"use client";

import type { Integration } from '@/types/integrations';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { IntegrationConnectionControls } from './IntegrationConnectionControls';
import { StatusBadge } from './StatusBadge';
import { IntegrationWarning } from './IntegrationWarning';
import { Loader2 } from 'lucide-react';

interface IntegrationCardProps {
  integration: Integration; // Hela integrationsobjektet
}

/**
 * Ett premium, responsivt kort för att visa status och
 * hantera en enskild integration (t.ex. Fortnox).
 */
export function IntegrationCard({ integration }: IntegrationCardProps) {
  // Hämta realtidsstatus, men använd prop som initialdata
  const { data: statusData, isLoading } = useIntegrationStatus(integration.id);

  const currentStatus = statusData?.status || integration.status;
  const lastError = statusData?.last_error || integration.last_error;
  const lastSync = statusData?.last_synced_at || integration.last_synced_at;
  const stats = statusData?.statistics || {};

  // Få logotyp och namn från providern
  const providerDetails = {
    fortnox: {
      name: 'Fortnox',
      logo: 'F', // Placeholder - kan ersättas med SVG senare
      description: 'Fakturering, kunder och projekt',
      gradient: 'from-blue-500 to-purple-600',
    },
    visma_eaccounting: {
      name: 'Visma eAccounting',
      logo: 'VE',
      description: 'Fakturering och bokföring',
      gradient: 'from-green-500 to-teal-600',
    },
    visma_payroll: {
      name: 'Visma Payroll',
      logo: 'VP',
      description: 'Lön och personaladministration',
      gradient: 'from-teal-500 to-cyan-600',
    },
  }[integration.provider];

  if (!providerDetails) return null; // Stödjer inte denna provider

  return (
    <div className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl">
      
      {/* 1. Header (Logo, Titel, Status) */}
      <div className="p-6 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className={`relative bg-gradient-to-r ${providerDetails.gradient} rounded-xl p-3 shadow-md`}>
            <span className="text-xl font-black text-white">{providerDetails.logo}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {providerDetails.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {providerDetails.description}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <StatusBadge status={currentStatus} />
          {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
      </div>

      {/* 2. Body (Endast för fel) */}
      {currentStatus === 'error' && lastError && (
        <div className="px-6 pb-6 border-t border-gray-200 dark:border-gray-700">
          <IntegrationWarning variant="error" title="Ett fel har inträffat">
            {lastError}
          </IntegrationWarning>
        </div>
      )}

      {/* 3. Footer (Statistik - visas endast när ansluten) */}
      {currentStatus === 'connected' && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Senaste Synk</span>
              <p className="text-sm font-semibold dark:text-white">
                {lastSync ? new Date(lastSync).toLocaleTimeString('sv-SE') : 'Väntar...'}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400">Synkade Kunder</span>
              <p className="text-sm font-semibold dark:text-white">{stats.customers || 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Actions (Knappar) */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
        <IntegrationConnectionControls
          integrationId={integration.id}
          status={currentStatus}
          provider={integration.provider}
        />
      </div>
    </div>
  );
}

