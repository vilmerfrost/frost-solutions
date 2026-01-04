// app/payroll/periods/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { PeriodFilters } from '@/components/payroll/PeriodFilters';
import { PeriodList } from '@/components/payroll/PeriodList';
import { usePayrollPeriods } from '@/hooks/usePayrollPeriods';
import { Plus, FileSpreadsheet } from 'lucide-react';
import type { PayrollPeriodFilters } from '@/types/payroll';

export default function PayrollPeriodsPage() {
 const [filters, setFilters] = useState<PayrollPeriodFilters>({});

 const { data: periods, isLoading, error } = usePayrollPeriods(filters);

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <div className="flex items-center justify-between">
       <div className="flex items-center gap-4">
        <div className="p-3 bg-primary-500 hover:bg-primary-600 rounded-[8px] shadow-md">
         <FileSpreadsheet size={32} className="text-white" />
        </div>
        <div>
         <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Löneexport
         </h1>
         <p className="text-gray-600 dark:text-gray-400 mt-1">
          Exportera tidrapporter till Fortnox och Visma
         </p>
        </div>
       </div>
       <Link href="/payroll/periods/new">
        <Button
         size="lg"
         className="shadow-xl bg-primary-500 hover:bg-primary-600 hover: hover:"
        >
         <Plus size={20} className="mr-2" />
         Ny Period
        </Button>
       </Link>
      </div>
     </div>

     {/* Filters */}
     <PeriodFilters filters={filters} onFiltersChange={setFilters} />

     {/* Error State */}
     {error && (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-[8px] p-6 mb-6">
       <p className="text-red-600 dark:text-red-400">{error.message}</p>
      </div>
     )}

     {/* Period List */}
     <PeriodList periods={periods || []} isLoading={isLoading} />
    </div>
   </main>
  </div>
 );
}

