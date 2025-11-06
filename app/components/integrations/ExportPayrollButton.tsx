// app/components/integrations/ExportPayrollButton.tsx
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIntegrations, useExportToFortnox } from '@/hooks/useIntegrations';
import { Sparkles, Upload, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

interface ExportPayrollButtonProps {
  /** Månad i format YYYY-MM */
  month: string;
  /** Variant: 'button' | 'badge' */
  variant?: 'button' | 'badge';
  /** Custom className */
  className?: string;
}

/**
 * Premium AI-stöd export-knapp för att exportera lönespec till Fortnox/Visma
 */
export function ExportPayrollButton({
  month,
  variant = 'button',
  className = '',
}: ExportPayrollButtonProps) {
  const router = useRouter();
  const { data: integrations, isLoading: isLoadingIntegrations } = useIntegrations();
  const exportMutation = useExportToFortnox();
  const [isExporting, setIsExporting] = useState(false);

  // Hitta Fortnox eller Visma Payroll integration
  const fortnoxIntegration = integrations?.find(int => int.provider === 'fortnox' && int.status === 'connected');
  const vismaPayrollIntegration = integrations?.find(int => 
    int.provider === 'visma_payroll' && int.status === 'connected'
  );
  const vismaEAccountingIntegration = integrations?.find(int => 
    int.provider === 'visma_eaccounting' && int.status === 'connected'
  );

  const hasConnectedIntegration = !!fortnoxIntegration || !!vismaPayrollIntegration || !!vismaEAccountingIntegration;
  const isExportingState = exportMutation.isPending || isExporting || isLoadingIntegrations;

  // Get integration name
  const getIntegrationName = () => {
    if (fortnoxIntegration) return 'Fortnox';
    if (vismaPayrollIntegration) return 'Visma Payroll';
    if (vismaEAccountingIntegration) return 'Visma eAccounting';
    return 'Fortnox/Visma';
  };

  const handleExport = async () => {
    if (!hasConnectedIntegration) {
      toast.error('Ingen integration ansluten. Anslut till Fortnox eller Visma först i Inställningar → Integrationer');
      router.push('/settings/integrations');
      return;
    }

    setIsExporting(true);

    try {
      const integrationId = fortnoxIntegration?.id || vismaPayrollIntegration?.id || vismaEAccountingIntegration?.id;
      if (!integrationId) {
        toast.error('Integration ID saknas');
        return;
      }

      // Export payroll data via API
      const response = await fetch(`/api/integrations/${integrationId}/export-payroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export misslyckades');
      }

      toast.success(`Lönespec för ${month} har köats för export till ${getIntegrationName()}`);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error(`Export misslyckades: ${error?.message || 'Ett oväntat fel uppstod'}`);
    } finally {
      setIsExporting(false);
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
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md transition-all ${className}`}
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
        disabled={isExportingState}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-md transition-all disabled:opacity-70 ${className}`}
      >
        {isExportingState ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporterar...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <Upload className="w-4 h-4" />
            <span>Exportera lönespec till {getIntegrationName()}</span>
          </>
        )}
      </button>
    );
  }

  // Badge variant
  return (
    <button
      onClick={handleExport}
      disabled={isExportingState}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-all disabled:opacity-70 ${className}`}
    >
      {isExportingState ? (
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

