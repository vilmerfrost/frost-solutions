// app/components/integrations/FortnoxConnectButton.tsx
"use client";

import { useConnectIntegration } from '@/hooks/useIntegrations';
import { Loader2, Building } from 'lucide-react';

export function FortnoxConnectButton() {
 const connectMutation = useConnectIntegration();

 const handleConnect = () => {
  connectMutation.mutate('fortnox');
 };

 return (
  <button
   onClick={handleConnect}
   disabled={connectMutation.isPending}
   className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-base font-medium text-white bg-primary-500 hover:bg-primary-600 hover: hover: rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
  >
   {connectMutation.isPending ? (
    <Loader2 className="w-5 h-5 animate-spin" />
   ) : (
    <Building className="w-5 h-5" />
   )}
   <span>Anslut till Fortnox</span>
  </button>
 );
}

