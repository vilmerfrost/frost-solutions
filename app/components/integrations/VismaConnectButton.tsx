// app/components/integrations/VismaConnectButton.tsx
"use client";

import { useConnectIntegration } from '@/hooks/useIntegrations';
import { Loader2, FileText, Users } from 'lucide-react';
import type { AccountingProvider } from '@/types/integrations';

type VismaProvider = 'visma_eaccounting' | 'visma_payroll';

interface VismaConnectButtonProps {
 provider: VismaProvider;
}

export function VismaConnectButton({ provider }: VismaConnectButtonProps) {
 const connectMutation = useConnectIntegration();

 const handleConnect = () => {
  connectMutation.mutate(provider as AccountingProvider);
 };

 const isEAccounting = provider === 'visma_eaccounting';
 const label = isEAccounting ? 'Visma eAccounting' : 'Visma Payroll';
 const Icon = isEAccounting ? FileText : Users;

 return (
  <button
   onClick={handleConnect}
   disabled={connectMutation.isPending}
   className="inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] text-base font-medium text-white bg-primary-500 hover:bg-primary-600 hover: rounded-lg shadow-md transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
  >
   {connectMutation.isPending ? (
    <Loader2 className="w-5 h-5 animate-spin" />
   ) : (
    <Icon className="w-5 h-5" />
   )}
   <span>Anslut till {label}</span>
  </button>
 );
}

