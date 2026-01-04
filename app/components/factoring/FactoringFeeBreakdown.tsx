// app/components/factoring/FactoringFeeBreakdown.tsx
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { formatAmount } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface FactoringFeeBreakdownProps {
 invoiceAmount: number;
 feePercentage: number;
 feeAmount: number;
 netAmount: number;
 className?: string;
}

export function FactoringFeeBreakdown({
 invoiceAmount,
 feePercentage,
 feeAmount,
 netAmount,
 className,
}: FactoringFeeBreakdownProps) {
 return (
  <Card className={cn('bg-gray-50 dark:bg-gray-900 dark:/20 dark:/20', className)}>
   <CardContent className="p-4 space-y-3">
    <div className="flex justify-between text-sm">
     <span className="text-gray-600 dark:text-gray-400">Fakturabelopp:</span>
     <span className="font-medium text-gray-900 dark:text-white">
      {formatAmount(invoiceAmount)}
     </span>
    </div>
    
    <div className="flex justify-between text-sm">
     <span className="text-gray-600 dark:text-gray-400">Avgift ({feePercentage.toFixed(2)}%):</span>
     <span className="font-medium text-red-600 dark:text-red-400">
      -{formatAmount(feeAmount)}
     </span>
    </div>
    
    <div className="border-t border-gray-300 dark:border-gray-700 pt-3 flex justify-between">
     <span className="font-semibold text-gray-900 dark:text-white">Du får ut:</span>
     <span className="font-bold text-lg text-green-600 dark:text-green-400">
      {formatAmount(netAmount)}
     </span>
    </div>
   </CardContent>
  </Card>
 );
}

