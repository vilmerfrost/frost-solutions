// app/components/integrations/ExportToIntegrationButton.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIntegrationStatus, useSyncInvoice, useSyncCustomer } from '@/hooks/useIntegrations';
import { Sparkles, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import type { AccountingProvider } from '@/types/integrations';

interface ExportToIntegrationButtonProps {
  /** Typ av data som ska exporteras */
  type: 'invoice' | 'customer' | 'project';
  /** ID för resursen som ska exporteras */
  resourceId: string;
  /** Namn på resursen (för visning) */
  resourceName?: string;
  /** Bulk export - array av IDs */
  resourceIds?: string[];
  /** Variant: 'button' | 'badge' | 'inline' */
  variant?: 'button' | 'badge' | 'inline';
  /** Custom className */
  className?: string;
}

/**
 * Premium AI-stöd export-knapp för att exportera data till Fortnox/Visma
 * Visar smart suggestions och checkar integration status automatiskt
 */
export function ExportToIntegrationButton({
  type,
  resourceId,
  resourceName,
  resourceIds,
  variant = 'button',
  className = '',
}: ExportToIntegrationButtonProps) {
  const router = useRouter();
  const { data: integrationStatus, isLoading: isLoadingIntegrations } = useIntegrationStatus();
  const syncInvoiceMutation = useSyncInvoice();
  const syncCustomerMutation = useSyncCustomer();
  const [isChecking, setIsChecking] = useState(false);

  // Hitta Fortnox integration
  const fortnoxIntegration = integrationStatus?.integrations?.find(int => int.provider === 'fortnox' && int.status === 'active');
  const vismaIntegration = integrationStatus?.integrations?.find(int => 
    int.provider === 'visma' && int.status === 'active'
  );

  const hasConnectedIntegration = !!fortnoxIntegration || !!vismaIntegration;
  const provider: AccountingProvider | null = fortnoxIntegration ? 'fortnox' : vismaIntegration ? 'visma' : null;
  const isExporting = syncInvoiceMutation.isPending || syncCustomerMutation.isPending || isChecking;

  // Get resource type name in Swedish
  const getResourceTypeName = () => {
    switch (type) {
      case 'invoice':
        return resourceIds ? 'fakturor' : 'faktura';
      case 'customer':
        return resourceIds ? 'kunder' : 'kund';
      case 'project':
        return 'projekt';
      default:
        return 'data';
    }
  };

  // Get integration name
  const getIntegrationName = () => {
    if (fortnoxIntegration) return 'Fortnox';
    if (vismaIntegration) return 'Visma';
    return 'Fortnox/Visma';
  };

  const handleExport = async () => {
    if (!hasConnectedIntegration || !provider) {
      toast.error('Ingen integration ansluten. Anslut till Fortnox eller Visma först i Inställningar → Integrationer');
      router.push('/integrations');
      return;
    }

    setIsChecking(true);

    try {
      // Single export
      if (!resourceIds) {
        if (type === 'customer') {
          await syncCustomerMutation.mutateAsync({
            clientId: resourceId,
            provider,
          });
        } else if (type === 'invoice') {
          await syncInvoiceMutation.mutateAsync({
            invoiceId: resourceId,
            provider,
          });
        } else {
          toast.error('Projekt kan inte exporteras ännu');
          return;
        }
        toast.success(`${getResourceTypeName().charAt(0).toUpperCase() + getResourceTypeName().slice(1)} synkad till ${getIntegrationName()}`);
      } else {
        // Bulk export - export each one
        let successCount = 0;
        let errorCount = 0;

        for (const id of resourceIds) {
          try {
            if (type === 'customer') {
              await syncCustomerMutation.mutateAsync({
                clientId: id,
                provider,
              });
            } else if (type === 'invoice') {
              await syncInvoiceMutation.mutateAsync({
                invoiceId: id,
                provider,
              });
            }
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Failed to export ${id}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} ${getResourceTypeName()} synkade till ${getIntegrationName()}`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} ${getResourceTypeName()} kunde inte synkas`);
        }
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Synkronisering misslyckades: ${error?.message || 'Ett oväntat fel uppstod'}`);
    } finally {
      setIsChecking(false);
    }
  };

  // Loading state
  if (isLoadingIntegrations) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Kontrollerar integrationer...</span>
      </div>
    );
  }

  // No integration connected
  if (!hasConnectedIntegration) {
    if (variant === 'badge') {
      return (
        <button
          onClick={() => router.push('/settings/integrations')}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all ${className}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Anslut integration för export</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => router.push('/settings/integrations')}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md transition-all disabled:opacity-70 ${className}`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Anslut integration för export</span>
      </button>
    );
  }

  // Button variant
  if (variant === 'button') {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md transition-all disabled:opacity-70 ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporterar...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <Upload className="w-4 h-4" />
            <span>
              Exportera {resourceIds ? `${resourceIds.length} ${getResourceTypeName()}` : getResourceTypeName()} till {getIntegrationName()}
            </span>
          </>
        )}
      </button>
    );
  }

  // Badge variant
  if (variant === 'badge') {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all disabled:opacity-70 ${className}`}
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporterar...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Exportera till {getIntegrationName()}</span>
          </>
        )}
      </button>
    );
  }

  // Inline variant
  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={`inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors disabled:opacity-70 ${className}`}
    >
      {isExporting ? (
        <>
          <Loader2 className="w-3 h-3 animate-spin" />
          <span>Exporterar...</span>
        </>
      ) : (
        <>
          <Sparkles className="w-3 h-3" />
          <span>Exportera till {getIntegrationName()}</span>
        </>
      )}
    </button>
  );
}

