// app/components/integrations/SyncInvoiceButton.tsx

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { useSyncInvoice } from '@/hooks/useIntegrations';
import { useIntegrationStatus } from '@/hooks/useIntegrations';
import { Upload, Loader2, AlertCircle } from 'lucide-react';
import type { AccountingProvider } from '@/types/integrations';

interface SyncInvoiceButtonProps {
 invoiceId: string;
 disabled?: boolean;
 variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
 size?: 'sm' | 'md' | 'lg';
}

export function SyncInvoiceButton({
 invoiceId,
 disabled,
 variant = 'primary',
 size = 'md',
}: SyncInvoiceButtonProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [selectedProvider, setSelectedProvider] = useState<AccountingProvider | ''>('');

 const { data: statusData } = useIntegrationStatus();
 const syncMutation = useSyncInvoice();

 const activeIntegrations =
  statusData?.integrations?.filter((i) => i.status === 'active') || [];

 const hasActiveIntegrations = activeIntegrations.length > 0;

 const handleSync = async () => {
  if (!selectedProvider) return;

  await syncMutation.mutateAsync({
   invoiceId,
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
    <Upload size={16} className="mr-2" />
    Synka till bokföring
   </Button>

   <Dialog
    open={isOpen}
    onClose={() => setIsOpen(false)}
    title="Synka faktura till bokföringssystem"
    footer={
     <>
      <Button
       variant="secondary"
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
         <Upload size={16} className="mr-2" />
         Synka faktura
        </>
       )}
      </Button>
     </>
    }
   >
    <div className="space-y-4">
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
       Fakturan kommer att skapas i det valda systemet med all relevant
       information.
      </p>
     </div>
    </div>
   </Dialog>
  </>
 );
}

