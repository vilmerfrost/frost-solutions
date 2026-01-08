// app/components/payroll/ExportButton.tsx
// ✅ FIXED: No lucide-react icons - Pure SVG to avoid HMR cache issues
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useExportPayrollPeriod } from '@/hooks/usePayrollPeriods';
import { ValidationIssues } from './ValidationIssues';
import type { PayrollValidationIssue } from '@/types/payroll';

// Pure SVG icons - no external dependencies
const UploadIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className={className}
 >
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="17 8 12 3 7 8" />
  <line x1="12" y1="3" x2="12" y2="15" />
 </svg>
);

const LoaderIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className={`animate-spin ${className}`}
 >
  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
 </svg>
);

const AlertTriangleIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
 <svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
  className={className}
 >
  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
  <path d="M12 9v4" />
  <path d="M12 17h.01" />
 </svg>
);

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
    className="bg-primary-500 hover:bg-primary-600 hover: hover:"
   >
    {exportMutation.isPending ? (
     <>
      <LoaderIcon size={20} className="mr-2" />
      Exporterar...
     </>
    ) : (
     <>
      <UploadIcon size={20} className="mr-2" />
      Exportera period
     </>
    )}
   </Button>

   {/* Visa varningar efter lyckad export */}
   {showWarnings && warnings.length > 0 && (
    <div className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-yellow-200 dark:border-yellow-700 p-6">
     <div className="flex items-center gap-3 mb-4">
      <AlertTriangleIcon size={20} className="text-yellow-600 dark:text-yellow-400" />
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

