// app/components/payroll/PeriodList.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Eye, Lock, Upload, Unlock, MoreVertical } from '@/lib/ui/icons';
import { useLockPayrollPeriod, useExportPayrollPeriod, useUnlockPayrollPeriod } from '@/hooks/usePayrollPeriods';
import type { PayrollPeriod, PayrollPeriodStatus } from '@/types/payroll';

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

interface PeriodListProps {
 periods: PayrollPeriod[];
 isLoading: boolean;
}

export function PeriodList({ periods, isLoading }: PeriodListProps) {
 const [menuOpen, setMenuOpen] = useState<string | null>(null);

 if (isLoading) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
    <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar löneperioder...</p>
   </div>
  );
 }

 if (periods.length === 0) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
    <p className="text-gray-600 dark:text-gray-400 mb-4">
     Inga löneperioder ännu. Skapa din första period.
    </p>
    <Link href="/payroll/periods/new">
     <Button>Skapa löneperiod</Button>
    </Link>
   </div>
  );
 }

 return (
  <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
   <Table>
    <TableHeader>
     <TableRow>
      <TableHead>Period</TableHead>
      <TableHead>Format</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Låst</TableHead>
      <TableHead>Exporterad</TableHead>
      <TableHead className="text-right">Åtgärder</TableHead>
     </TableRow>
    </TableHeader>
    <TableBody>
     {periods.map((period) => (
      <PeriodRow
       key={period.id}
       period={period}
       menuOpen={menuOpen}
       onMenuToggle={(id) => setMenuOpen(menuOpen === id ? null : id)}
      />
     ))}
    </TableBody>
   </Table>
  </div>
 );
}

function PeriodRow({
 period,
 menuOpen,
 onMenuToggle,
}: {
 period: PayrollPeriod;
 menuOpen: string | null;
 onMenuToggle: (id: string) => void;
}) {
 const lockMutation = useLockPayrollPeriod(period.id);
 const exportMutation = useExportPayrollPeriod(period.id);
 const unlockMutation = useUnlockPayrollPeriod(period.id);

 const handleLock = () => {
  if (confirm('Lås denna period? Den kan inte redigeras efter låsning.')) {
   lockMutation.mutate();
  }
 };

 const handleExport = () => {
  exportMutation.mutate();
 };

 const handleUnlock = () => {
  if (confirm('Lås upp denna period? Detta bör endast göras av administratörer.')) {
   unlockMutation.mutate();
  }
 };

 const canLock = period.status === 'open';
 const canExport = period.status === 'locked';
 const canUnlock = ['locked', 'exported', 'failed'].includes(period.status);

 return (
  <TableRow>
   <TableCell>
    <Link
     href={`/payroll/periods/${period.id}`}
     className="text-primary-500 hover:underline font-medium"
    >
     {formatDate(period.start_date)} - {formatDate(period.end_date)}
    </Link>
   </TableCell>
   <TableCell>
    {period.export_format ? (
     <Badge variant="default">{formatLabels[period.export_format]}</Badge>
    ) : (
     <span className="text-gray-400">-</span>
    )}
   </TableCell>
   <TableCell>
    <Badge variant={statusColors[period.status]}>{statusLabels[period.status]}</Badge>
   </TableCell>
   <TableCell>
    {period.locked_at ? (
     <span className="text-sm text-gray-600 dark:text-gray-400">
      {formatDate(period.locked_at)}
     </span>
    ) : (
     <span className="text-gray-400">-</span>
    )}
   </TableCell>
   <TableCell>
    {period.exported_at ? (
     <span className="text-sm text-gray-600 dark:text-gray-400">
      {formatDate(period.exported_at)}
     </span>
    ) : (
     <span className="text-gray-400">-</span>
    )}
   </TableCell>
   <TableCell className="text-right">
    <div className="relative inline-block">
     <button
      onClick={() => onMenuToggle(period.id)}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
     >
      <MoreVertical size={16} />
     </button>

     {menuOpen === period.id && (
      <>
       <div className="fixed inset-0 z-10" onClick={() => onMenuToggle(period.id)} />
       <div className="absolute right-0 mt-2 w-48 bg-gray-50 dark:bg-gray-900 rounded-md shadow-md z-20 border border-gray-200 dark:border-gray-700">
        <Link
         href={`/payroll/periods/${period.id}`}
         className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
        >
         <Eye size={16} className="mr-2" />
         Visa detaljer
        </Link>

        {canLock && (
         <button
          onClick={handleLock}
          disabled={lockMutation.isPending}
          className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-600"
         >
          <Lock size={16} className="mr-2" />
          Lås period
         </button>
        )}

        {canExport && (
         <button
          onClick={handleExport}
          disabled={exportMutation.isPending}
          className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
         >
          <Upload size={16} className="mr-2" />
          Exportera
         </button>
        )}

        {canUnlock && (
         <button
          onClick={handleUnlock}
          disabled={unlockMutation.isPending}
          className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-orange-600"
         >
          <Unlock size={16} className="mr-2" />
          Lås upp (Admin)
         </button>
        )}
       </div>
      </>
     )}
    </div>
   </TableCell>
  </TableRow>
 );
}

