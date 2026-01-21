// app/payroll/periods/[id]/page.tsx
'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExportButton } from '@/components/payroll/ExportButton';
import { ValidationIssues } from '@/components/payroll/ValidationIssues';
import {
 usePayrollPeriod,
 useLockPayrollPeriod,
 useUnlockPayrollPeriod,
} from '@/hooks/usePayrollPeriods';
import { useAdmin } from '@/hooks/useAdmin';
import {
 ArrowLeft,
 Lock,
 Unlock,
 Calendar,
 FileText,
 Clock,
 User,
 AlertCircle,
} from 'lucide-react';
import type { PayrollPeriodStatus, PayrollValidationIssue } from '@/types/payroll';

const statusColors: Record<PayrollPeriodStatus, 'success' | 'warning' | 'info' | 'danger'> = {
 open: 'success',
 locked: 'warning',
 exported: 'info',
 failed: 'danger',
};

const statusLabels: Record<PayrollPeriodStatus, string> = {
 open: 'Öppen',
 locked: 'Låst',
 exported: 'Exporterad',
 failed: 'Misslyckad',
};

const formatLabels: Record<string, string> = {
 'fortnox-paxml': 'Fortnox PAXml',
 'visma-csv': 'Visma CSV',
};

const formatDate = (date: string) => {
 return new Date(date).toLocaleDateString('sv-SE');
};

const formatDateTime = (date: string) => {
 return new Date(date).toLocaleString('sv-SE');
};

export default function PayrollPeriodDetailPage() {
 const params = useParams();
 const router = useRouter();
 const periodId = params.id as string;

 const { data: period, isLoading, error } = usePayrollPeriod(periodId);
 const lockMutation = useLockPayrollPeriod(periodId);
 const unlockMutation = useUnlockPayrollPeriod(periodId);
 const { isAdmin } = useAdmin();

 const [activeTab, setActiveTab] = useState<'overview' | 'validation' | 'export'>('overview');
 const [lockErrors, setLockErrors] = useState<PayrollValidationIssue[]>([]);
 const [lockWarnings, setLockWarnings] = useState<PayrollValidationIssue[]>([]);

 const handleLock = async (force = false) => {
  if (!force && !confirm('Lås denna period? Den kan inte redigeras efter låsning.')) {
   return;
  }

  try {
   const result = await lockMutation.mutateAsync(force ? { force: true } : undefined);
   if (result.success) {
    setLockErrors([]);
    if (result.warnings && result.warnings.length) {
     const warnings = result.warnings.map(issue => ({ ...issue, level: 'warning' as const }));
     setLockWarnings(warnings);
     setActiveTab('validation');
    } else {
     setLockWarnings([]);
    }
   } else if (result.errors) {
    setLockWarnings([]);
    setLockErrors(result.errors);
    setActiveTab('validation');
   }
  } catch (err) {
   // Errors handled via mutation onError/toasts
  }
 };

 const handleForceLock = () => {
  if (!isAdmin) return;
  handleLock(true);
 };

 const handleUnlock = async () => {
  if (confirm('Lås upp denna period? Detta bör endast göras av administratörer.')) {
   await unlockMutation.mutateAsync();
  }
 };

 if (isLoading) {
  return (
   <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
    <Sidebar />
    <main className="flex-1 lg:ml-0">
     <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-6">
       <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
       <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
     </div>
    </main>
   </div>
  );
 }

 if (error || !period) {
  return (
   <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
    <Sidebar />
    <main className="flex-1 lg:ml-0">
     <div className="container mx-auto px-4 py-8">
      <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl p-8 text-center">
       <div className="flex justify-center mb-4">
        <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
         <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
        </div>
       </div>
       <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        Period hittades inte
       </h2>
       <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error?.message || 'Perioden kunde inte laddas'}
       </p>
       <Button onClick={() => router.push('/payroll/periods')}>
        <ArrowLeft size={16} className="mr-2" />
        Tillbaka till listan
       </Button>
      </div>
     </div>
    </main>
   </div>
  );
 }

 const canLock = period.status === 'open';
 const canExport = period.status === 'locked' || period.status === 'failed';
 const canUnlock = ['locked', 'exported', 'failed'].includes(period.status);

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
       <ArrowLeft size={16} className="mr-2" />
       Tillbaka
      </Button>

      <div className="flex items-center justify-between">
       <div>
        <div className="flex items-center gap-4 mb-2">
         <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          {formatDate(period.start_date)} - {formatDate(period.end_date)}
         </h1>
         <Badge variant={statusColors[period.status]} className="text-lg px-4 py-1">
          {statusLabels[period.status]}
         </Badge>
        </div>
        {period.export_format && (
         <p className="text-gray-600 dark:text-gray-400">
          Format: {formatLabels[period.export_format]}
         </p>
        )}
       </div>

       {/* Actions */}
       <div className="flex gap-3">
        {canLock && (
         <Button
          onClick={() => handleLock()}
          disabled={lockMutation.isPending}
          className="bg-primary-500 hover:bg-primary-600 "
         >
          <Lock size={16} className="mr-2" />
          Lås Period
         </Button>
        )}

        {canUnlock && (
         <Button
          onClick={handleUnlock}
          disabled={unlockMutation.isPending}
          variant="secondary"
         >
          <Unlock size={16} className="mr-2" />
          Lås upp
         </Button>
        )}
       </div>
      </div>
     </div>

     {/* Tabs */}
     <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex border-b border-gray-200 dark:border-gray-700">
       <button
        onClick={() => setActiveTab('overview')}
        className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
         activeTab === 'overview'
          ? 'bg-primary-500 hover:bg-primary-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
       >
        Översikt
       </button>
       <button
        onClick={() => setActiveTab('validation')}
        className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
         activeTab === 'validation'
          ? 'bg-primary-500 hover:bg-primary-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
       >
        Validering
       </button>
       <button
        onClick={() => setActiveTab('export')}
        className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
         activeTab === 'export'
          ? 'bg-primary-500 hover:bg-primary-600 text-white'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
       >
        Export
       </button>
      </div>

      <div className="p-6">
       {/* Overview Tab */}
       {activeTab === 'overview' && (
        <div className="space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Period Info */}
          <div className="space-y-4">
           <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
             <Calendar size={20} className="text-primary-500 dark:text-primary-400" />
            </div>
            <div>
             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Period
             </label>
             <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {formatDate(period.start_date)} - {formatDate(period.end_date)}
             </p>
            </div>
           </div>

           <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
             <FileText size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
             <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Exportformat
             </label>
             <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {period.export_format
               ? formatLabels[period.export_format]
               : 'Ej valt'}
             </p>
            </div>
           </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-gray-50 dark:bg-gray-900 dark:bg-blue-900/20 rounded-[8px] p-6 border-2 border-primary-200 dark:border-primary-800">
           <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Status Timeline
           </h3>

           <div className="space-y-3">
            {/* Created */}
            <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div>
             <span className="text-sm text-gray-700 dark:text-gray-300">
              Skapad {period.created_at && formatDateTime(period.created_at)}
             </span>
            </div>

            {/* Locked */}
            {period.locked_at && (
             <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex items-center gap-2">
               <Clock size={14} className="text-yellow-600" />
               <span className="text-sm text-gray-700 dark:text-gray-300">
                Låst {formatDateTime(period.locked_at)}
               </span>
              </div>
             </div>
            )}

            {period.locked_by && (
             <div className="flex items-center gap-3 ml-5">
              <User size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
               Av: {period.locked_by}
              </span>
             </div>
            )}

            {/* Exported */}
            {period.exported_at && (
             <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex items-center gap-2">
               <FileText size={14} className="text-blue-600" />
               <span className="text-sm text-gray-700 dark:text-gray-300">
                Exporterad {formatDateTime(period.exported_at)}
               </span>
              </div>
             </div>
            )}

            {period.exported_by && (
             <div className="flex items-center gap-3 ml-5">
              <User size={14} className="text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
               Av: {period.exported_by}
              </span>
             </div>
            )}
           </div>
          </div>
         </div>
        </div>
       )}

       {/* Validation Tab */}
       {activeTab === 'validation' && (
        <div className="space-y-6">
         {lockErrors.length > 0 && (
          <div className="space-y-4">
           <ValidationIssues issues={lockErrors} />
           {isAdmin && (
            <div className="flex justify-end">
             <Button
              variant="destructive"
              onClick={handleForceLock}
              disabled={lockMutation.isPending}
             >
              {lockMutation.isPending ? 'Låser...' : 'Tvinga låsning (admin)'}
             </Button>
            </div>
           )}
          </div>
         )}
         {lockWarnings.length > 0 && (
          <div className="space-y-4">
           <ValidationIssues issues={lockWarnings} />
          </div>
         )}
         {lockErrors.length === 0 && lockWarnings.length === 0 && (
          <div className="text-center py-12">
           <p className="text-gray-600 dark:text-gray-400">
            Inga valideringsfel hittades
           </p>
          </div>
         )}
        </div>
       )}

       {/* Export Tab */}
       {activeTab === 'export' && (
        <div className="space-y-6">
         {period.status === 'exported' ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-[8px] p-6 text-center">
           <p className="text-green-800 dark:text-green-300 mb-4">
            Period redan exporterad {period.exported_at && formatDateTime(period.exported_at)}
           </p>
          </div>
         ) : !isAdmin ? (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-[8px] p-6 text-center">
           <p className="text-yellow-800 dark:text-yellow-300">
            Endast administratörer kan exportera löneperioder
           </p>
          </div>
         ) : canExport ? (
          <ExportButton periodId={period.id} />
         ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-[8px] p-6 text-center">
           <p className="text-yellow-800 dark:text-yellow-300">
            Perioden måste vara låst innan den kan exporteras
           </p>
          </div>
         )}
        </div>
       )}
      </div>
     </div>
    </div>
   </main>
  </div>
 );
}

