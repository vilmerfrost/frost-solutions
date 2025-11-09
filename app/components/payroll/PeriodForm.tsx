// app/components/payroll/PeriodForm.tsx
'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Save, AlertTriangle } from '@/lib/ui/icons';

const periodSchema = z.object({
  startDate: z.string().min(1, 'Startdatum är obligatoriskt'),
  endDate: z.string().min(1, 'Slutdatum är obligatoriskt'),
  format: z.enum(['fortnox-paxml', 'visma-csv'], {
    errorMap: () => ({ message: 'Välj ett exportformat' }),
  }),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: 'Startdatum måste vara före slutdatum',
  path: ['endDate'],
});

type PeriodFormData = z.infer<typeof periodSchema>;

interface PeriodFormProps {
  onSubmit: (data: PeriodFormData) => void;
  isLoading: boolean;
}

export function PeriodForm({ onSubmit, isLoading }: PeriodFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<PeriodFormData>({
    resolver: zodResolver(periodSchema),
    defaultValues: {
      startDate: '',
      endDate: '',
      format: 'fortnox-paxml',
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Beräkna antal dagar
  const daysDiff = startDate && endDate
    ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const showWarning = daysDiff > 31;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          Period information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Startdatum *"
            type="date"
            {...register('startDate')}
            error={errors.startDate?.message}
          />

          <Input
            label="Slutdatum *"
            type="date"
            {...register('endDate')}
            error={errors.endDate?.message}
          />
        </div>

        <div className="mt-4">
          <Select
            label="Exportformat *"
            {...register('format')}
            error={errors.format?.message}
          >
            <option value="fortnox-paxml">Fortnox PAXml</option>
            <option value="visma-csv">Visma CSV</option>
          </Select>
        </div>

        {/* Varning om lång period */}
        {showWarning && (
          <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 flex gap-3">
            <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Lång period ({daysDiff} dagar)
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                Perioder längre än 31 dagar rekommenderas inte. Överväg att dela upp i mindre perioder.
              </p>
            </div>
          </div>
        )}

        {/* Period info */}
        {daysDiff > 0 && !showWarning && (
          <div className="mt-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
            <p className="text-sm text-purple-800 dark:text-purple-300">
              Period längd: <strong>{daysDiff} dagar</strong>
            </p>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="submit"
          disabled={isLoading}
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Save size={16} className="mr-2" />
          {isLoading ? 'Skapar...' : 'Skapa period'}
        </Button>
      </div>
    </form>
  );
}

