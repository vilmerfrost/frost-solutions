// app/components/integrations/IntegrationStatusCard.tsx
"use client";

import React from 'react';
import type { Integration } from '@/types/integrations';
import { useDisconnectIntegration } from '@/hooks/useIntegrations';
import { FortnoxConnectButton } from './FortnoxConnectButton';
import { VismaConnectButton } from './VismaConnectButton';
import { Loader2, CheckCircle, XCircle, Power, PowerOff } from 'lucide-react';

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
    gradient: ' ',
    connectButton: <FortnoxConnectButton />
   };
  case 'visma_eaccounting':
   return {
    name: 'Visma eAccounting',
    icon: 'VE',
    gradient: 'from-green-500 ',
    connectButton: <VismaConnectButton provider="visma_eaccounting" />
   };
  case 'visma_payroll':
   return {
    name: 'Visma Payroll',
    icon: 'VP',
    gradient: 'from-green-500 ',
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
 const disconnectMutation = useDisconnectIntegration();

 // Use integration prop directly (no additional status query to avoid hooks complexity)
 const currentStatus = integration.status;
 const lastSync = integration.last_sync_at;
 const providerInfo = getProviderInfo(integration.provider);

 const handleDisconnect = () => {
  if (!integration?.provider) {
   console.error('❌ Cannot disconnect: integration.provider is missing', integration);
   return;
  }
  
  if (window.confirm(`Är du säker på att du vill koppla bort ${providerInfo.name}?`)) {
   disconnectMutation.mutate(integration.provider);
  }
 };
 
 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md overflow-hidden">
   <div className="p-6">
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
     <div className="flex items-center gap-4">
      <div className={`h-12 w-12 ${providerInfo.gradient} rounded-lg flex items-center justify-center text-white font-bold text-xl`}>
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
   </div>
   
   {/* Statistik-footer (visas bara om ansluten) */}
   {currentStatus === 'connected' && (
    <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
     <div className="grid grid-cols-1 gap-4 text-center">
      <div>
       <span className="text-xs text-gray-500 dark:text-gray-400">Senaste Synk</span>
       <p className="text-sm font-semibold dark:text-white">
        {lastSync ? new Date(lastSync).toLocaleString('sv-SE') : 'Aldrig'}
       </p>
      </div>
     </div>
    </div>
   )}
  </div>
 );
}

