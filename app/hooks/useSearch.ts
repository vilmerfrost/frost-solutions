'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/fetcher';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';

interface SearchFilters {
 status?: string[];
 priority?: string[];
 dateRange?: [Date, Date];
 customerId?: string;
}

interface SearchResults {
 projects?: any[];
 clients?: any[];
 invoices?: any[];
}

export function useSearch() {
 const [query, setQuery] = useState('');
 const [filters, setFilters] = useState<SearchFilters>({});

 const searchMutation = useMutation({
  mutationFn: async (searchQuery: string): Promise<SearchResults> => {
   const result = await apiFetch<{ data: SearchResults }>('/api/search', {
    method: 'POST',
    body: JSON.stringify({
     query: searchQuery,
     filters: Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined && v !== null)
     ),
    }),
   });

   console.log('Search results:', result);
   return result.data as SearchResults;
  },
  onError: (error: any) => {
   toast.error('Sökning misslyckades: ' + extractErrorMessage(error));
  },
 });

 return {
  query,
  setQuery,
  filters,
  setFilters,
  search: searchMutation.mutate,
  results: searchMutation.data,
  isSearching: searchMutation.isPending,
  error: searchMutation.error,
 };
}

