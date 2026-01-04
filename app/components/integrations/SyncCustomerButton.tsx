// app/components/integrations/SyncCustomerButton.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useSyncCustomer } from '@/hooks/useIntegrations';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { Users, Loader2, AlertCircle } from 'lucide-react';
import type { AccountingProvider } from '@/types/integrations';

interface SyncCustomerButtonProps {
 clientId: string;
 clientName: string;
 disabled?: boolean;
 variant?: 'default' | 'outline' | 'ghost';
 size?: 'sm' | 'md' | 'lg';
}

export function SyncCustomerButton({
 clientId,
 clientName,
 disabled,
 variant = 'default',
 size = 'md',
}: SyncCustomerButtonProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [selectedProvider, setSelectedProvider] = useState<AccountingProvider | ''>('');

 const { data: statusData } = useIntegrationStatus();
 const syncMutation = useSyncCustomer();

 const activeIntegrations =
  statusData?.integrations?.filter((i) => i.status === 'active') || [];

 const hasActiveIntegrations = activeIntegrations.length > 0;

 const handleSync = async () => {
  if (!selectedProvider) return;

  await syncMutation.mutateAsync({
   clientId,
   provider: selectedProvider,
  });

  setIsOpen(false);
  setSelectedProvider('');
 };

 if (!hasActiveIntegrations) {
  return (
   <Button variant={variant} size={size} disabled>
    <AlertCircle size={16} className="mr-2" />
    Ingen integration
   </Button>
  );
 }

 return (
  <>
   <Button
    variant={variant}
    size={size}
    disabled={disabled}
    onClick={() => setIsOpen(true)}
   >
    <Users size={16} className="mr-2" />
    Synka kund
   </Button>

   <Dialog
    open={isOpen}
    onClose={() => setIsOpen(false)}
    title="Synka kund till bokföringssystem"
    footer={
     <>
      <Button
       variant="outline"
       onClick={() => setIsOpen(false)}
       disabled={syncMutation.isPending}
      >
       Avbryt
      </Button>
      <Button
       onClick={handleSync}
       disabled={!selectedProvider || syncMutation.isPending}
      >
       {syncMutation.isPending ? (
        <>
         <Loader2 size={16} className="mr-2 animate-spin" />
         Synkar...
        </>
       ) : (
        <>
         <Users size={16} className="mr-2" />
         Synka kund
        </>
       )}
      </Button>
     </>
    }
   >
    <div className="space-y-4">
     {/* Customer Info */}
     <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
       Kund:
      </p>
      <p className="font-medium text-gray-900 dark:text-white">
       {clientName}
      </p>
     </div>

     {/* Provider Selection */}
     <div>
      <Select
       label="Välj bokföringssystem"
       value={selectedProvider}
       onChange={(e) =>
        setSelectedProvider(e.target.value as AccountingProvider)
       }
      >
       <option value="">Välj system...</option>
       {activeIntegrations.map((integration) => (
        <option key={integration.id} value={integration.provider}>
         {integration.provider === 'fortnox'
          ? 'Fortnox'
          : 'Visma eEkonomi'}
        </option>
       ))}
      </Select>
     </div>

     {/* Info */}
     <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <p className="text-sm text-blue-800 dark:text-blue-300">
       Kunden kommer att skapas/uppdateras i det valda systemet.
      </p>
     </div>
    </div>
   </Dialog>
  </>
 );
}

