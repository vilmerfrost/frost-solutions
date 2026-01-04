// app/settings/integrations/page.tsx
"use client";

import { Suspense } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useIntegrationStatus, useConnectIntegration, useDisconnectIntegration } from '@/hooks/useIntegrations';
import { Loader2, Lock, AlertTriangle, Info } from 'lucide-react';
import Sidebar from '@/components/SidebarClient';

// Importera de nya, premium-komponenterna
import { IntegrationCard } from '@/components/integrations/IntegrationCard';
import { IntegrationWarning } from '@/components/integrations/IntegrationWarning';
import { OAuthCallbackHandler } from '@/components/integrations/OAuthCallbackHandler';
import type { AccountingProvider } from '@/types/integrations';

/**
 * Huvudsida för hantering av integrationer (t.ex. Fortnox).
 * Helt responsiv, mobil-först och premium-design.
 */
export default function IntegrationsPage() {
 const { isAdmin, loading: isAdminLoading } = useAdmin();
 const { data: integrationStatus, isLoading: isLoadingIntegrations, isError } = useIntegrationStatus();
 const connectMutation = useConnectIntegration();
 const disconnectMutation = useDisconnectIntegration();
 const integrations = integrationStatus?.integrations || [];
 
 // Hitta integrationer per provider
 const fortnoxIntegration = integrations.find(int => int.provider === 'fortnox');
 const vismaIntegration = integrations.find(int => int.provider === 'visma');
 
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

 // Skydda sidan för endast administratörer
 if (!isAdmin) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
    <Sidebar />
    <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
     <div className="flex flex-col items-center justify-center h-64 text-center p-4">
      <Lock className="w-12 h-12 text-red-500" />
      <h1 className="mt-4 text-2xl font-bold">Åtkomst nekad</h1>
      <p className="text-gray-600 dark:text-gray-400">Denna sida är endast tillgänglig för administratörer.</p>
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
      <IntegrationWarning
       variant="error"
       title="Kunde inte ladda integrationer"
      >
       Ett nätverksfel inträffade vid hämtning av integrationsstatus. Vänligen ladda om sidan.
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
    {/* Suspense behövs för att useSearchParams() ska fungera i callback-hanteraren */}
    <Suspense fallback={<Loader2 className="w-8 h-8 animate-spin" />}>
     {/* Hanterar ?connected=fortnox eller ?error=... i URL:en */}
     <OAuthCallbackHandler />
     
     <div className="space-y-8 p-4 md:p-6 lg:p-10 max-w-7xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrationer</h1>
      
      {/*
       Denna informationsruta ersätter den stora blåa rutan från din skärmdump.
       Den är renare och mer kontextuell.
      */}
      <div className="p-4 md:p-6 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 mb-6 relative z-10">
       <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
         <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 text-base">Viktigt att veta om Fortnox</h3>
         <div className="space-y-3">
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
           För att ansluta, se till att ditt Fortnox-konto har "Fortnox-paket (Fakturering, Bokföring, Lön)" aktiverat. 
           Gratis-konton saknar API-åtkomst och kan inte anslutas.
          </p>
          <div className="pt-2 flex-shrink-0">
           <a
            href="/faq#integrationer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-md hover:scale-105 active:scale-95"
            style={{ 
             display: 'inline-flex', 
             visibility: 'visible',
             opacity: 1,
             position: 'relative',
             zIndex: 10,
             minWidth: 'fit-content'
            }}
           >
            <span className="whitespace-nowrap">Läs mer i FAQ</span>
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
           </a>
          </div>
         </div>
        </div>
       </div>
      </div>

      {/* DEN RESPONSIVA GRIDDEN:
       - 1 kolumn på mobil (grid-cols-1)
       - 2 kolumner på surfplatta (md:grid-cols-2)
       - 3 kolumner på desktop (xl:grid-cols-3)
       Detta löser hela ditt layout-problem.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
       {/* Fortnox Card */}
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

       {/* Visma Card */}
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

       {/* Om inga integrationer finns, visa meddelande */}
       {!fortnoxIntegration && !vismaIntegration && (
        <div className="col-span-full">
         <IntegrationWarning variant="info" title="Inga integrationer hittades">
          Det finns inga integrationer konfigurerade ännu. Integrationer skapas automatiskt när du försöker ansluta till en tjänst.
         </IntegrationWarning>
        </div>
       )}
      </div>
     </div>
    </Suspense>
   </main>
  </div>
 );
}
