// app/components/integrations/ExportToIntegrationButton.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIntegrations, useExportToFortnox } from '@/hooks/useIntegrations';
import { Sparkles, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

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
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const exportMutation = useExportToFortnox();
  const [isChecking, setIsChecking] = useState(false);

  // Hitta Fortnox integration
  const fortnoxIntegration = integrations?.find(int => int.provider === 'fortnox' && int.status === 'connected');
  const vismaIntegration = integrations?.find(int => 
    (int.provider === 'visma_eaccounting' || int.provider === 'visma_payroll') && int.status === 'connected'
  );

  const hasConnectedIntegration = !!fortnoxIntegration || !!vismaIntegration;
  const isExporting = exportMutation.isPending || isChecking;

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
    if (vismaIntegration) {
      if (vismaIntegration.provider === 'visma_eaccounting') return 'Visma eAccounting';
      if (vismaIntegration.provider === 'visma_payroll') return 'Visma Payroll';
      return 'Visma';
    }
    return 'Fortnox/Visma';
  };

  const handleExport = async () => {
    if (!hasConnectedIntegration) {
      toast.error('Ingen integration ansluten. Anslut till Fortnox eller Visma först i Inställningar → Integrationer');
      router.push('/settings/integrations');
      return;
    }

    setIsChecking(true);

    try {
      const integrationId = fortnoxIntegration?.id || vismaIntegration?.id;
      if (!integrationId) {
        toast.error('Integration ID saknas');
        return;
      }

      // Single export
      if (!resourceIds) {
        await exportMutation.mutateAsync({
          integrationId,
          type: type === 'customer' ? 'customer' : 'invoice',
          id: resourceId,
        });
        toast.success(`${getResourceTypeName().charAt(0).toUpperCase() + getResourceTypeName().slice(1)} köad för export`);
      } else {
        // Bulk export - export each one
        let successCount = 0;
        let errorCount = 0;

        for (const id of resourceIds) {
          try {
            await exportMutation.mutateAsync({
              integrationId,
              type: type === 'customer' ? 'customer' : 'invoice',
              id,
            });
            successCount++;
          } catch (error) {
            errorCount++;
            console.error(`Failed to export ${id}:`, error);
          }
        }

        if (successCount > 0) {
          toast.success(`${successCount} ${getResourceTypeName()} köade för export`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} ${getResourceTypeName()} kunde inte exporteras`);
        }
      }
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export misslyckades: ${error?.message || 'Ett oväntat fel uppstod'}`);
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

