// app/settings/integrations/page.tsx
"use client";

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useIntegrationStatus, useConnectIntegration, useDisconnectIntegration } from '@/hooks/useIntegrations';
import { useTenant } from '@/context/TenantContext';
import { apiFetch } from '@/lib/http/fetcher';
import supabase from '@/utils/supabase/supabaseClient';
import {
  Loader2,
  Lock,
  AlertTriangle,
  Info,
  Activity,
  RefreshCw,
  Wifi,
  WifiOff,
  FileSignature,
  Send,
  ChevronDown,
  ChevronUp,
  XCircle,
} from 'lucide-react';
import Sidebar from '@/components/SidebarClient';

// Importera de nya, premium-komponenterna
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationWarning } from '@/components/integrations/IntegrationWarning';
import { OAuthCallbackHandler } from '@/components/integrations/OAuthCallbackHandler';
import type { AccountingProvider } from '@/types/integrations';
import { BASE_PATH } from '@/utils/url';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface HealthData {
  integrationId: string
  integrationStatus: string
  lastSync: string | null
  lastSyncStatus: string | null
  lastSyncError: string | null
  pendingJobs: number
  failedJobs: number
  recentErrors: Array<{
    created_at: string
    status: string
    error_message: string
    entity_type?: string
    entity_id?: string
  }>
}

/* ------------------------------------------------------------------ */
/* Health Card Component                                               */
/* ------------------------------------------------------------------ */

function HealthStatusDot({ status }: { status: 'green' | 'yellow' | 'red' | 'gray' }) {
  const colors = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500 animate-pulse',
    red: 'bg-red-500',
    gray: 'bg-gray-400',
  }
  return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />
}

function getHealthStatus(health: HealthData | null, connected: boolean): 'green' | 'yellow' | 'red' | 'gray' {
  if (!connected) return 'gray'
  if (!health) return 'yellow'
  if (health.failedJobs > 0 || health.lastSyncStatus === 'error') return 'red'
  if (health.pendingJobs > 0) return 'yellow'
  return 'green'
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Aldrig'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just nu'
  if (mins < 60) return `${mins} min sedan`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h sedan`
  const days = Math.floor(hours / 24)
  return `${days}d sedan`
}

function IntegrationHealthCard({
  name,
  icon,
  connected,
  health,
  loading,
  onSync,
  onDisconnect,
  syncing,
}: {
  name: string
  icon: React.ReactNode
  connected: boolean
  health: HealthData | null
  loading: boolean
  onSync?: () => void
  onDisconnect?: () => void
  syncing?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const status = getHealthStatus(health, connected)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <HealthStatusDot status={loading ? 'yellow' : status} />
            <div className="text-gray-500 dark:text-gray-400">{icon}</div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
          </div>
          {connected && health && (health.failedJobs > 0 || health.recentErrors?.length > 0) && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            Laddar...
          </div>
        ) : connected ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Senaste synk</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {formatTimeAgo(health?.lastSync ?? null)}
              </span>
            </div>
            {health && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Fel</span>
                  <span className={`font-medium ${health.failedJobs > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {health.failedJobs}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Kopende jobb</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {health.pendingJobs}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Ej ansluten</p>
        )}
      </div>

      {/* Action buttons */}
      {connected && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex gap-2">
          {onSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="flex-1 px-3 py-2 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              Synka manuellt
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Hantera
          </button>
        </div>
      )}

      {/* Expanded error details */}
      {expanded && health && (
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-850">
          {health.recentErrors.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Senaste fel
              </p>
              {health.recentErrors.map((err, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-gray-700 dark:text-gray-300 truncate">
                      {err.error_message || 'Okant fel'}
                    </p>
                    <p className="text-gray-400 dark:text-gray-500">
                      {formatTimeAgo(err.created_at)}
                      {err.entity_type && ` — ${err.entity_type}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400">Inga senaste fel</p>
          )}

          {onDisconnect && (
            <button
              onClick={() => {
                if (confirm(`Ar du saker pa att du vill koppla fran ${name}?`)) {
                  onDisconnect()
                }
              }}
              className="mt-4 w-full px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              Koppla fran
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* BankID (Idura) Card                                                 */
/* ------------------------------------------------------------------ */

function BankIdCard() {
  const { tenantId } = useTenant()
  const [signingCount, setSigningCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) return
    async function load() {
      try {
        // Get this month's signing orders
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const { data, error } = await supabase
          .from('signing_orders')
          .select('id, status')
          .eq('tenant_id', tenantId as string)
          .gte('created_at', startOfMonth.toISOString())

        if (!error && data) {
          setSigningCount(data.length)
          setPendingCount(data.filter((o: any) => o.status === 'pending').length)
        }
      } catch {
        // Silent — table may not exist
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId])

  const status = loading ? 'yellow' : signingCount > 0 ? 'green' : 'gray'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-3">
        <HealthStatusDot status={status} />
        <FileSignature className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">BankID (Idura)</h3>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Laddar...
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Signeringar denna manad</span>
            <span className="text-gray-900 dark:text-white font-medium">{signingCount}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Status</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {pendingCount > 0 ? `${pendingCount} vantar` : 'Alla klara'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* PEPPOL Card                                                         */
/* ------------------------------------------------------------------ */

function PeppolCard() {
  // PEPPOL is not yet configured — static placeholder
  const configured = false

  return (
    <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-3 mb-3">
        <HealthStatusDot status={configured ? 'green' : 'gray'} />
        <Send className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">PEPPOL</h3>
      </div>
      {configured ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Skickade fakturor</span>
            <span className="text-gray-900 dark:text-white font-medium">0</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Mottagna fakturor</span>
            <span className="text-gray-900 dark:text-white font-medium">0</span>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Ej konfigurerad</p>
          <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
            Konfigurera &rarr;
          </button>
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function IntegrationsPage() {
  const { isAdmin, loading: isAdminLoading } = useAdmin();
  const { tenantId } = useTenant();
  const { data: integrationStatus, isLoading: isLoadingIntegrations, isError } = useIntegrationStatus();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();
  const integrations = integrationStatus?.integrations || [];

  // Hitta integrationer per provider
  const fortnoxIntegration = integrations.find(int => int.provider === 'fortnox');
  const vismaIntegration = integrations.find(int => int.provider === 'visma');

  // Health data
  const [fortnoxHealth, setFortnoxHealth] = useState<HealthData | null>(null);
  const [vismaHealth, setVismaHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [syncingFortnox, setSyncingFortnox] = useState(false);
  const [syncingVisma, setSyncingVisma] = useState(false);

  // Fetch health data for connected integrations
  useEffect(() => {
    if (isLoadingIntegrations) return;

    async function fetchHealth() {
      setHealthLoading(true);
      const promises: Promise<void>[] = [];

      if (fortnoxIntegration?.id) {
        promises.push(
          apiFetch<{ success: boolean; data: HealthData }>(`/api/integrations/${fortnoxIntegration.id}/health`)
            .then((res) => setFortnoxHealth(res.data))
            .catch(() => {})
        );
      }

      if (vismaIntegration?.id) {
        promises.push(
          apiFetch<{ success: boolean; data: HealthData }>(`/api/integrations/${vismaIntegration.id}/health`)
            .then((res) => setVismaHealth(res.data))
            .catch(() => {})
        );
      }

      await Promise.allSettled(promises);
      setHealthLoading(false);
    }

    fetchHealth();
  }, [isLoadingIntegrations, fortnoxIntegration?.id, vismaIntegration?.id]);

  // Manual sync handler
  async function handleSync(integrationId: string, provider: string) {
    const setSyncing = provider === 'fortnox' ? setSyncingFortnox : setSyncingVisma;
    setSyncing(true);
    try {
      await apiFetch(`/api/integrations/${integrationId}/sync`, { method: 'POST' });
      // Refresh health
      const res = await apiFetch<{ success: boolean; data: HealthData }>(`/api/integrations/${integrationId}/health`);
      if (provider === 'fortnox') setFortnoxHealth(res.data);
      else setVismaHealth(res.data);
    } catch {
      // Silent
    } finally {
      setSyncing(false);
    }
  }

  // Hantera laddning av data
  if (isAdminLoading || isLoadingIntegrations) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </main>
      </div>
    );
  }

  // Skydda sidan for endast administratorer
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
          <div className="flex flex-col items-center justify-center h-64 text-center p-4">
            <Lock className="w-12 h-12 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold">Atkomst nekad</h1>
            <p className="text-gray-600 dark:text-gray-400">Denna sida ar endast tillganglig for administratorer.</p>
          </div>
        </main>
      </div>
    );
  }

  // Hantera API-fel
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
          <div className="p-4 md:p-6">
            <IntegrationWarning variant="error" title="Kunde inte ladda integrationer">
              Ett natverksfel intraffade vid hamtning av integrationsstatus. Vanligen ladda om sidan.
            </IntegrationWarning>
          </div>
        </main>
      </div>
    );
  }

  // Huvud-layouten
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin" />}>
          <OAuthCallbackHandler />

          <div className="space-y-8 p-4 md:p-6 lg:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-500 rounded-lg shadow-md">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrationer</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Overvaka och hantera alla anslutna tjanster
                </p>
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 md:p-6 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 relative z-10">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-base">Viktigt att veta om Fortnox</h3>
                  <div className="space-y-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                      For att ansluta, se till att ditt Fortnox-konto har &quot;Fortnox-paket (Fakturering, Bokforing, Lon)&quot; aktiverat.
                      Gratis-konton saknar API-atkomst och kan inte anslutas.
                    </p>
                    <div className="pt-2 flex-shrink-0">
                      <a
                        href={`${BASE_PATH}/faq#integrationer`}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-md hover:scale-105 active:scale-95"
                      >
                        <span className="whitespace-nowrap">Las mer i FAQ</span>
                        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============ INTEGRATION HEALTH GRID ============ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Integration Health
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fortnox Health */}
                <IntegrationHealthCard
                  name="Fortnox"
                  icon={<Wifi className="w-5 h-5" />}
                  connected={fortnoxIntegration?.status === 'connected'}
                  health={fortnoxHealth}
                  loading={healthLoading && !!fortnoxIntegration}
                  onSync={fortnoxIntegration?.id ? () => handleSync(fortnoxIntegration.id, 'fortnox') : undefined}
                  onDisconnect={() => disconnectMutation.mutate('fortnox')}
                  syncing={syncingFortnox}
                />

                {/* Visma Health */}
                <IntegrationHealthCard
                  name="Visma"
                  icon={<Wifi className="w-5 h-5" />}
                  connected={vismaIntegration?.status === 'connected'}
                  health={vismaHealth}
                  loading={healthLoading && !!vismaIntegration}
                  onSync={vismaIntegration?.id ? () => handleSync(vismaIntegration.id, 'visma') : undefined}
                  onDisconnect={() => disconnectMutation.mutate('visma')}
                  syncing={syncingVisma}
                />

                {/* BankID */}
                <BankIdCard />

                {/* PEPPOL */}
                <PeppolCard />
              </div>
            </div>

            {/* ============ CONNECT/DISCONNECT CARDS (existing) ============ */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Anslutningar
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <IntegrationCard
                  provider="fortnox"
                  integration={fortnoxIntegration}
                  onConnect={() => connectMutation.mutate('fortnox')}
                  onDisconnect={() => {
                    if (confirm('Ar du saker pa att du vill koppla fran Fortnox?')) {
                      disconnectMutation.mutate('fortnox');
                    }
                  }}
                  isConnecting={connectMutation.isPending}
                  isDisconnecting={disconnectMutation.isPending}
                />

                <IntegrationCard
                  provider="visma"
                  integration={vismaIntegration}
                  onConnect={() => connectMutation.mutate('visma')}
                  onDisconnect={() => {
                    if (confirm('Ar du saker pa att du vill koppla fran Visma?')) {
                      disconnectMutation.mutate('visma');
                    }
                  }}
                  isConnecting={connectMutation.isPending}
                  isDisconnecting={disconnectMutation.isPending}
                />

                {!fortnoxIntegration && !vismaIntegration && (
                  <div className="col-span-full">
                    <IntegrationWarning variant="info" title="Inga integrationer hittades">
                      Det finns inga integrationer konfigurerade annu. Integrationer skapas automatiskt nar du forsoker ansluta till en tjanst.
                    </IntegrationWarning>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Suspense>
      </main>
    </div>
  );
}
