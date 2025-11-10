// app/components/rot/RotCalculator.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RotEligibilityBadge } from './RotEligibilityBadge';
import { rotDeduction, rotPercentFor, calculateMaxDeduction } from '@/lib/rot/rules';
import { formatAmount } from '@/lib/formatters';

interface RotCalculatorProps {
  invoiceDateISO: string;
  laborCost: number;
  materialCost?: number;
  className?: string;
}

export function RotCalculator({
  invoiceDateISO,
  laborCost,
  materialCost = 0,
  className,
}: RotCalculatorProps) {
  const percent = useMemo(
    () => rotPercentFor(invoiceDateISO),
    [invoiceDateISO]
  );
  const deduction = useMemo(
    () => rotDeduction(laborCost, percent),
    [laborCost, percent]
  );
  const maxDeduction = useMemo(
    () => calculateMaxDeduction(laborCost),
    [laborCost]
  );
  const eligible = laborCost > 0 && deduction <= maxDeduction;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>ROT-Avdrag Kalkylator</CardTitle>
        <RotEligibilityBadge
          eligible={eligible}
          reason={deduction > maxDeduction ? 'Överskrider maxbelopp' : undefined}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Arbetskostnad:</span>
          <span className="font-medium">{formatAmount(laborCost)}</span>
        </div>

        {materialCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Materialkostnad:</span>
            <span className="font-medium">{formatAmount(materialCost)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Avdragsprocent:</span>
          <span className="font-medium">{percent}%</span>
        </div>

        <div className="pt-4 border-t dark:border-gray-700 space-y-2">
          <div className="flex justify-between font-medium">
            <span>Beräknat avdrag:</span>
            <span className="text-green-600 dark:text-green-400">
              {formatAmount(deduction)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Maximalt avdrag:</span>
            <span>{formatAmount(maxDeduction)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Total kostnad:</span>
            <span>{formatAmount(laborCost + materialCost)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

