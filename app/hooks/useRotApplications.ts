// app/hooks/useRotApplications.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import type { RotDeduction } from '@/types/rot';

interface CreateRotApplicationInput {
 invoiceId: string;
 laborAmountSEK: number;
 materialAmountSEK?: number;
 travelAmountSEK?: number;
 customerPnrEnc: string;
 projectAddress?: string;
}

export function useRotApplications(tenantId?: string) {
 const queryClient = useQueryClient();

 const list = useQuery({
  queryKey: ['rot-applications', tenantId],
  queryFn: () =>
   apiFetch<{ success: boolean; data: RotDeduction[] }>(
    '/api/rot?scope=list'
   ),
  enabled: !!tenantId,
  staleTime: 1000 * 60 * 60, // 1 hour
 });

 const create = useMutation({
  mutationFn: (body: CreateRotApplicationInput) =>
   apiFetch<{ success: boolean; data: RotDeduction }>('/api/rot', {
    method: 'POST',
    body: JSON.stringify(body),
   }),
  onSuccess: () => {
   toast.success('ROT-ansökan skapad.');
   queryClient.invalidateQueries({ queryKey: ['rot-applications', tenantId] });
  },
  onError: (e: Error) => toast.error(e.message),
 });

 const generateXml = useMutation({
  mutationFn: (id: string) =>
   apiFetch<{ success: boolean; data: { xml: string } }>(
    `/api/rot/${id}/xml`,
    { method: 'POST' }
   ),
  onError: (e: Error) => toast.error(e.message),
 });

 return { list, create, generateXml };
}

