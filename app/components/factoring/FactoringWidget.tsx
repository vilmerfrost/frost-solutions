// app/components/factoring/FactoringWidget.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useFactoringOffers } from '@/hooks/useFactoringOffers';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { FactoringOfferCard } from './FactoringOfferCard';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { Loader2, Banknote } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface FactoringWidgetProps {
 tenantId: string;
 invoiceId: string;
 amountSEK: number;
 idempotencyKey?: string;
}

export function FactoringWidget({
 tenantId,
 invoiceId,
 amountSEK,
 idempotencyKey,
}: FactoringWidgetProps) {
 const queryClient = useQueryClient();
 const [open, setOpen] = useState(false);
 const { offers, createOffer, acceptOffer, rejectOffer } = useFactoringOffers(tenantId);

 // Real-time subscription for status updates
 useEffect(() => {
  if (typeof window === 'undefined' || !tenantId) return;
  const supabase = createBrowserClient();
  const channel = supabase
   .channel(`factoring_offers:${tenantId}`)
   .on(
    'postgres_changes',
    {
     event: 'UPDATE',
     schema: 'app',
     table: 'factoring_offers',
    },
    () => {
     queryClient.invalidateQueries({ queryKey: ['factoring-offers', tenantId] });
    }
   )
   .subscribe();

  return () => {
   supabase.removeChannel(channel);
  };
 }, [tenantId, queryClient]);

 const onCreate = useCallback(() => {
  createOffer.mutate({ invoiceId, idempotencyKey });
 }, [createOffer, invoiceId, idempotencyKey]);

 const latest = offers.data?.data?.[0];

 return (
  <div className="w-full">
   <div className="flex gap-2">
    <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
     <Banknote className="h-4 w-4" /> Fakturaförsäljning
    </Button>
    <Button onClick={onCreate} disabled={createOffer.isPending} className="gap-2">
     {createOffer.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
     Begär erbjudande
    </Button>
   </div>

   <Dialog open={open} onClose={() => setOpen(false)} title="Faktorering">
    <div className="space-y-4">
     <p className="text-sm text-gray-600 dark:text-gray-400">
      Faktura: {amountSEK.toLocaleString('sv-SE')} kr
     </p>
     {latest ? (
      <FactoringOfferCard
       offer={latest}
       onAccept={() => latest && acceptOffer.mutate(latest.id)}
       onReject={() => latest && rejectOffer.mutate(latest.id)}
       isLoading={acceptOffer.isPending || rejectOffer.isPending}
      />
     ) : (
      <p className="text-sm text-gray-600 dark:text-gray-400">Inga erbjudanden ännu.</p>
     )}
    </div>
   </Dialog>
  </div>
 );
}

