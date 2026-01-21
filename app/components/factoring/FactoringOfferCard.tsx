// app/components/factoring/FactoringOfferCard.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FactoringStatusBadge } from './FactoringStatusBadge';
import { FactoringFeeBreakdown } from './FactoringFeeBreakdown';
import { formatAmount, formatDate } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { FactoringOffer } from '@/types/factoring';
import { Loader2 } from 'lucide-react';

interface FactoringOfferCardProps {
 offer: FactoringOffer;
 onAccept?: () => void;
 onReject?: () => void;
 isLoading?: boolean;
}

export function FactoringOfferCard({
 offer,
 onAccept,
 onReject,
 isLoading = false,
}: FactoringOfferCardProps) {
 const isActionable = offer.status === 'offered' || offer.status === 'pending';
 
 // Extract amounts from response_payload if available
 const responsePayload = offer.response_payload as any;
 const invoiceAmount = responsePayload?.invoiceAmount || offer.offer_amount || 0;
 const feePercentage = responsePayload?.feePercentage || 0;
 const feeAmount = offer.fees || (invoiceAmount * feePercentage / 100);
 const netAmount = offer.offer_amount || (invoiceAmount - feeAmount);

 return (
  <Card className="w-full max-w-lg shadow-xl">
   <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-xl font-bold">
     Erbjudande #{offer.id.substring(0, 8)}
    </CardTitle>
    <FactoringStatusBadge status={offer.status} />
   </CardHeader>

   <CardContent className="space-y-4">
    <div className="text-4xl font-extrabold my-2 text-green-600 dark:text-green-400">
     {formatAmount(netAmount)}
    </div>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
     Nettobelopp att betala ut
    </p>

    <FactoringFeeBreakdown
     invoiceAmount={invoiceAmount}
     feePercentage={feePercentage}
     feeAmount={feeAmount}
     netAmount={netAmount}
    />

    {offer.expires_at && (
     <div className="mt-4 pt-4 border-t dark:border-gray-700">
      <p className="text-sm text-gray-600 dark:text-gray-300">
       Giltig till: <span className="font-semibold">{formatDate(offer.expires_at)}</span>
      </p>
     </div>
    )}
   </CardContent>

   {isActionable && (onAccept || onReject) && (
    <CardFooter className="flex justify-end gap-3 pt-4">
     {onReject && (
      <Button
       onClick={onReject}
       variant="secondary"
       disabled={isLoading}
       aria-label={`Neka factoring-erbjudande för faktura ${offer.invoice_id}`}
      >
       Neka
      </Button>
     )}
     {onAccept && (
      <Button
       onClick={onAccept}
       disabled={isLoading}
       aria-label={`Acceptera factoring-erbjudande för faktura ${offer.invoice_id}`}
      >
       {isLoading ? (
        <>
         <Loader2 className="h-4 w-4 mr-2 animate-spin" />
         Bearbetar...
        </>
       ) : (
        'Acceptera'
       )}
      </Button>
     )}
    </CardFooter>
   )}
  </Card>
 );
}

