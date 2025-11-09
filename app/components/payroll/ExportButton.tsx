// app/components/payroll/ExportButton.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, AlertTriangle } from '@/lib/ui/icons';
import { useExportPayrollPeriod } from '@/hooks/usePayrollPeriods';
import { ValidationIssues } from './ValidationIssues';
import type { PayrollValidationIssue } from '@/types/payroll';

interface ExportButtonProps {
  periodId: string;
  disabled?: boolean;
}

export function ExportButton({ periodId, disabled }: ExportButtonProps) {
  const exportMutation = useExportPayrollPeriod(periodId);
  const [warnings, setWarnings] = useState<PayrollValidationIssue[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);

  const handleExport = async () => {
    try {
      // Clear previous warnings
      setWarnings([]);
      setShowWarnings(false);

      const result = await exportMutation.mutateAsync();

      // Handle warnings from result
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
        setShowWarnings(true);
      }
    } catch (error: any) {
      // Error is already handled by mutation onError
      console.error('[ExportButton] Export failed', error);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handleExport}
        disabled={disabled || exportMutation.isPending}
        size="lg"
        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {exportMutation.isPending ? (
          <>
            <Loader2 size={20} className="mr-2 animate-spin" />
            Exporterar...
          </>
        ) : (
          <>
            <Upload size={20} className="mr-2" />
            Exportera period
          </>
        )}
      </Button>

      {/* Visa varningar efter lyckad export */}
      {showWarnings && warnings.length > 0 && (
        <div className="bg-gradient-to-br from-white via-yellow-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-yellow-200 dark:border-yellow-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Export genomförd med varningar
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Exporten lyckades, men följande varningar upptäcktes:
          </p>
          <ValidationIssues issues={warnings} />
        </div>
      )}
    </div>
  );
}

// Explicit default export to help with HMR
export default ExportButton;

