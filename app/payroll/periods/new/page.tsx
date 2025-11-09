// app/payroll/periods/new/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import { PeriodForm } from '@/components/payroll/PeriodForm';
import { useCreatePayrollPeriod } from '@/hooks/usePayrollPeriods';
import { ArrowLeft } from 'lucide-react';

export default function NewPayrollPeriodPage() {
  const router = useRouter();
  const createMutation = useCreatePayrollPeriod();

  const handleSubmit = async (data: any) => {
    const result = await createMutation.mutateAsync(data);
    router.push(`/payroll/periods/${result.id}`);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8 max-w-3xl">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Tillbaka
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Ny Löneperiod
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Skapa en ny period för löneexport
            </p>
          </div>

          {/* Form */}
          <PeriodForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </div>
      </main>
    </div>
  );
}

