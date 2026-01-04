// app/components/integrations/IntegrationConnectionControls.tsx
"use client";

import { useConnectFortnox, useConnectVisma, useDisconnectIntegration } from '@/hooks/useIntegrations';
import type { IntegrationStatus, IntegrationProvider } from '@/types/integrations';
import { Loader2, Building, Power, RefreshCw } from 'lucide-react';

interface IntegrationConnectionControlsProps {
 integrationId: string;
 status: IntegrationStatus;
 provider: IntegrationProvider;
}

export function IntegrationConnectionControls({ 
 integrationId, 
 status, 
 provider 
}: IntegrationConnectionControlsProps) {
 const connectFortnoxMutation = useConnectFortnox();
 const connectVismaMutation = useConnectVisma();
 const disconnectMutation = useDisconnectIntegration();

 // Enhetlig styling för knapparna
 const baseButton = "flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg min-h-[44px] transition-all duration-200 disabled:opacity-70 w-full";
 const gradientButton = `${baseButton} text-white bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md`;
 const redButton = `${baseButton} text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/50 dark:hover:bg-red-900`;
 const grayButton = `${baseButton} bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600`;
 
 const isLoading = connectFortnoxMutation.isPending || connectVismaMutation.isPending || disconnectMutation.isPending;

 // Responsiv wrapper: stapla knappar på mobil
 const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col sm:flex-row gap-2">{children}</div>
 );

 // 1. Ansluten
 if (status === 'connected') {
  return (
   <Wrapper>
    <button
     onClick={() => { /* TODO: Open sync settings */ }}
     disabled={isLoading}
     className={grayButton}
    >
     <RefreshCw className="w-4 h-4" /> Inställningar
    </button>
    <button
     onClick={() => disconnectMutation.mutate(integrationId)}
     disabled={isLoading}
     className={redButton}
    >
     {disconnectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
     Koppla från
    </button>
   </Wrapper>
  );
 }

 // 2. Felkonfigurerad
 if (status === 'misconfigured') {
  return (
   <Wrapper>
    <button
     onClick={() => {
      if (provider === 'fortnox') {
       connectFortnoxMutation.mutate();
      } else if (provider === 'visma_eaccounting' || provider === 'visma_payroll') {
       connectVismaMutation.mutate(provider);
      }
     }}
     disabled={isLoading}
     className={gradientButton}
    >
     {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building className="w-4 h-4" />}
     Försök igen
    </button>
   </Wrapper>
  );
 }

 // 3. Frånkopplad eller Error - Visa anslut-knapp
 const getProviderName = () => {
  switch (provider) {
   case 'fortnox':
    return 'Fortnox';
   case 'visma_eaccounting':
    return 'Visma eAccounting';
   case 'visma_payroll':
    return 'Visma Payroll';
   default:
    return 'Integration';
  }
 };

 const handleConnect = () => {
  if (provider === 'fortnox') {
   connectFortnoxMutation.mutate();
  } else if (provider === 'visma_eaccounting' || provider === 'visma_payroll') {
   connectVismaMutation.mutate(provider);
  }
 };

 return (
  <Wrapper>
   <button
    onClick={handleConnect}
    disabled={isLoading}
    className={gradientButton}
   >
    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building className="w-5 h-5" />}
    <span>Anslut till {getProviderName()}</span>
   </button>
  </Wrapper>
 );
}

