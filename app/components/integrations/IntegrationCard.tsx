// app/components/integrations/IntegrationCard.tsx

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import type {
  AccountingIntegration,
  AccountingProvider,
} from '@/types/integrations';

interface IntegrationCardProps {
  provider: AccountingProvider;
  integration?: AccountingIntegration;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isDisconnecting?: boolean;
}

const providerInfo = {
  fortnox: {
    name: 'Fortnox',
    description: 'Svensk bokföringsprogramvara',
    logo: '🇸🇪',
    color: 'from-blue-500 to-indigo-600',
  },
  visma: {
    name: 'Visma eEkonomi',
    description: 'Nordisk bokföringslösning',
    logo: '🇳🇴',
    color: 'from-green-500 to-emerald-600',
  },
};

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
  active: 'success',
  expired: 'warning',
  error: 'danger',
  pending: 'default',
};

const statusIcons = {
  active: CheckCircle,
  expired: AlertTriangle,
  error: XCircle,
  pending: Loader2,
};

const statusLabels = {
  active: 'Ansluten',
  expired: 'Utgången',
  error: 'Fel',
  pending: 'Väntar',
};

export function IntegrationCard({
  provider,
  integration,
  onConnect,
  onDisconnect,
  isConnecting,
  isDisconnecting,
}: IntegrationCardProps) {
  const info = providerInfo[provider];
  const isConnected = integration && integration.status === 'active';
  const StatusIcon = integration ? statusIcons[integration.status] : null;

  return (
    <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 bg-gradient-to-r ${info.color} rounded-xl shadow-lg text-3xl`}
          >
            {info.logo}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {info.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {info.description}
            </p>
          </div>
        </div>
        {/* Status Badge */}
        {integration && StatusIcon && (
          <Badge
            variant={statusColors[integration.status]}
            className="flex items-center gap-1"
          >
            <StatusIcon size={14} />
            {statusLabels[integration.status]}
          </Badge>
        )}
      </div>

      {/* Connection Info */}
      {integration && (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Ansluten:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Date(integration.created_at).toLocaleDateString('sv-SE')}
            </span>
          </div>
          {integration.last_sync_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Senaste sync:
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(integration.last_sync_at).toLocaleString('sv-SE')}
              </span>
            </div>
          )}
          {integration.expires_at && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Går ut:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(integration.expires_at).toLocaleDateString('sv-SE')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!isConnected ? (
          <Button
            onClick={onConnect}
            disabled={isConnecting}
            className={`flex-1 bg-gradient-to-r ${info.color} hover:opacity-90 text-white`}
          >
            {isConnecting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Ansluter...
              </>
            ) : (
              `Anslut ${info.name}`
            )}
          </Button>
        ) : (
          <Button
            variant="outline"
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="flex-1"
          >
            {isDisconnecting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Kopplar från...
              </>
            ) : (
              'Koppla från'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
