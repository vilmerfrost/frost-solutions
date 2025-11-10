// app/hooks/useFactoringOffers.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import type { FactoringOffer } from '@/types/factoring';

interface CreateOfferInput {
  invoiceId: string;
  idempotencyKey?: string;
}

export function useFactoringOffers(tenantId?: string) {
  const queryClient = useQueryClient();

  const offers = useQuery({
    queryKey: ['factoring-offers', tenantId],
    queryFn: () =>
      apiFetch<{ success: boolean; data: FactoringOffer[] }>(
        '/api/factoring/offers?scope=list'
      ),
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const createOffer = useMutation({
    mutationFn: (body: CreateOfferInput) =>
      apiFetch<{ success: boolean; data: FactoringOffer }>(
        '/api/factoring/offers',
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      ),
    onSuccess: () => {
      toast.success('Faktorering förfrågan skickad.');
      queryClient.invalidateQueries({ queryKey: ['factoring-offers', tenantId] });
    },
    onError: (e: Error) =>
      toast.error(e.message || 'Kunde inte skicka förfrågan.'),
  });

  const acceptOffer = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean; data: FactoringOffer }>(
        `/api/factoring/offers/${id}/accept`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      toast.success('Erbjudande accepterat.');
      queryClient.invalidateQueries({ queryKey: ['factoring-offers', tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rejectOffer = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean; data: FactoringOffer }>(
        `/api/factoring/offers/${id}/reject`,
        {
          method: 'POST',
        }
      ),
    onSuccess: () => {
      toast.info('Erbjudande avvisat.');
      queryClient.invalidateQueries({ queryKey: ['factoring-offers', tenantId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { offers, createOffer, acceptOffer, rejectOffer };
}

