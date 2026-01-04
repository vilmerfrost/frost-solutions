// app/components/payroll/PeriodFilters.tsx
'use client';

import React from 'react';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X, Filter } from '@/lib/ui/icons';
import type { PayrollPeriodFilters, PayrollPeriodStatus } from '@/types/payroll';

interface PeriodFiltersProps {
 filters: PayrollPeriodFilters;
 onFiltersChange: (filters: PayrollPeriodFilters) => void;
}

const statuses: PayrollPeriodStatus[] = ['open', 'locked', 'exported', 'failed'];

const statusLabels: Record<PayrollPeriodStatus, string> = {
 open: 'Öppen',
 locked: 'Låst',
 exported: 'Exporterad',
 failed: 'Misslyckad',
};

export function PeriodFilters({ filters, onFiltersChange }: PeriodFiltersProps) {
 const handleClear = () => {
  onFiltersChange({});
 };

 const hasFilters = filters.status || filters.start || filters.end;

 return (
  <div className="bg-white dark:from-gray-800 dark:/50 dark:to-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
   <div className="flex items-center gap-3 mb-4">
    <Filter size={20} className="text-primary-500 dark:text-primary-400" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
     Filtrera löneperioder
    </h3>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Select
     label="Status"
     value={filters.status || ''}
     onChange={(e) =>
      onFiltersChange({ ...filters, status: e.target.value as PayrollPeriodStatus || undefined })
     }
    >
     <option value="">Alla statusar</option>
     {statuses.map((status) => (
      <option key={status} value={status}>
       {statusLabels[status]}
      </option>
     ))}
    </Select>

    <Input
     label="Start datum"
     type="date"
     value={filters.start || ''}
     onChange={(e) => onFiltersChange({ ...filters, start: e.target.value || undefined })}
    />

    <Input
     label="Slut datum"
     type="date"
     value={filters.end || ''}
     onChange={(e) => onFiltersChange({ ...filters, end: e.target.value || undefined })}
    />

    <div className="flex items-end">
     {hasFilters && (
      <Button variant="ghost" onClick={handleClear} className="w-full">
       <X size={16} className="mr-2" />
       Rensa filter
      </Button>
     )}
    </div>
   </div>
  </div>
 );
}

