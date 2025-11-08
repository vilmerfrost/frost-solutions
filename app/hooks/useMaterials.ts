// app/hooks/useMaterials.ts
'use client'

import { useQuery } from '@tanstack/react-query'
import { MaterialsAPI } from '@/lib/api/quotes'

export function useMaterials(search?: string) {
  return useQuery({
    queryKey: ['materials', search],
    queryFn: () => MaterialsAPI.list(search),
    staleTime: 1000 * 60 * 5 // 5 min
  })
}

