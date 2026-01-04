// app/integrations/page.tsx

'use client';

import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { SyncStatusCard } from '@/components/integrations/SyncStatusCard';
import { SyncLogsTable } from '@/components/integrations/SyncLogsTable';
import { SyncAnalytics } from '@/components/integrations/SyncAnalytics';
import { Button } from '@/components/ui/button';
import {
 useIntegrationStatus,
 useConnectIntegration,
 useDisconnectIntegration,
 useIntegrationAnalytics,
} from '@/hooks/useIntegrations';
import { Settings, RefreshCw } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function IntegrationsPage() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const [timeRange, setTimeRange] = React.useState(30);
 const { data, isLoading, refetch } = useIntegrationStatus();
 const { data: analyticsData, isLoading: analyticsLoading } = useIntegrationAnalytics(timeRange);
 const connectMutation = useConnectIntegration();
 const disconnectMutation = useDisconnectIntegration();

 // Handle OAuth callback results
 useEffect(() => {
  const success = searchParams.get('success');
  const error = searchParams.get('error');
  const provider = searchParams.get('provider');
  const message = searchParams.get('message');

  if (success === 'true' && provider) {
   toast.success('Integration ansluten!', {
    description: `${
     provider === 'fortnox' ? 'Fortnox' : 'Visma'
    } är nu kopplad`,
   });

   // Clean URL
   router.replace('/integrations');

   // Refetch data
   refetch();
  } else if (error) {
   const errorMessages: Record<string, string> = {
    invalid_request: 'Ogiltig förfrågan',
    invalid_state: 'Ogiltig session (state)',
    token_exchange_failed: 'Kunde inte hämta tokens',
    token_storage_failed: 'Kunde inte spara tokens',
    database_error: 'Databasfel',
    unknown: 'Okänt fel',
   };

   toast.error('Integration misslyckades', {
    description: message || errorMessages[error] || error,
   });
   // Clean URL
   router.replace('/integrations');
  }
 }, [searchParams, router, refetch]);

 const fortnoxIntegration = data?.integrations?.find(
  (i) => i.provider === 'fortnox'
 );
 const vismaIntegration = data?.integrations?.find(
  (i) => i.provider === 'visma'
 );

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />

   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-500 hover:bg-primary-600 rounded-[8px] shadow-md">
         <Settings size={32} className="text-white" />
        </div>
        <div>
         <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Integrationer
         </h1>
         <p className="text-gray-600 dark:text-gray-400 mt-1">
          Anslut ditt bokföringssystem för automatisk synkronisering
         </p>
        </div>
       </div>
       <Button
        variant="outline"
        onClick={() => refetch()}
        disabled={isLoading}
        size="lg"
       >
        <RefreshCw
         size={16}
         className={`mr-2 ${isLoading ? 'animate-spin' : ''}`}
        />
        Uppdatera
       </Button>
      </div>
     </div>

     {/* Integration Cards */}
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <IntegrationCard
       provider="fortnox"
       integration={fortnoxIntegration}
       onConnect={() => connectMutation.mutate('fortnox')}
       onDisconnect={() => {
        if (confirm('Är du säker på att du vill koppla från Fortnox?')) {
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
        if (confirm('Är du säker på att du vill koppla från Visma?')) {
         disconnectMutation.mutate('visma');
        }
       }}
       isConnecting={connectMutation.isPending}
       isDisconnecting={disconnectMutation.isPending}
      />
     </div>

     {/* Sync Status */}
     {data?.stats && (
      <div className="mb-8">
       <SyncStatusCard stats={data.stats} isLoading={isLoading} />
      </div>
     )}

     {/* Analytics */}
     {analyticsData?.success && (
      <div className="mb-8">
       <SyncAnalytics
        timeline={analyticsData.timeline || []}
        operationBreakdown={analyticsData.operationBreakdown || []}
        providerBreakdown={analyticsData.providerBreakdown || []}
        resourceBreakdown={analyticsData.resourceBreakdown || []}
        overall={analyticsData.overall || {
         total: 0,
         success: 0,
         error: 0,
         successRate: 0,
         avgDuration: 0,
        }}
        isLoading={analyticsLoading}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
       />
      </div>
     )}

     {/* Sync Logs */}
     {data?.recentLogs && (
      <SyncLogsTable logs={data.recentLogs} isLoading={isLoading} />
     )}
    </div>
   </main>
  </div>
 );
}

