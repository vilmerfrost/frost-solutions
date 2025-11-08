// app/components/quotes/QuoteFilters.tsx
'use client'

import React from 'react'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useClients } from '@/hooks/useClients'
import { X } from 'lucide-react'
import type { QuoteFilters as IQuoteFilters, QuoteStatus } from '@/types/quotes'

interface QuoteFiltersProps {
  filters: IQuoteFilters
  onFiltersChange: (filters: IQuoteFilters) => void
}

const statuses: QuoteStatus[] = [
  'draft',
  'pending_approval',
  'approved',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'archived'
]

const statusLabels: Record<QuoteStatus, string> = {
  draft: 'Utkast',
  pending_approval: 'Väntar godkännande',
  approved: 'Godkänd',
  sent: 'Skickad',
  viewed: 'Visad',
  accepted: 'Accepterad',
  rejected: 'Avvisad',
  expired: 'Utgången',
  archived: 'Arkiverad'
}

export function QuoteFilters({ filters, onFiltersChange }: QuoteFiltersProps) {
  const { data: clients } = useClients()

  const handleClear = () => {
    onFiltersChange({ page: 1, limit: 20 })
  }

  const hasFilters = filters.status || filters.customer_id || filters.search

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 backdrop-blur-sm bg-opacity-95">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Select
          label="Status"
          value={filters.status || ''}
          onChange={(e) => onFiltersChange({ ...filters, status: e.target.value as QuoteStatus || undefined, page: 1 })}
          className="bg-white dark:bg-gray-800"
        >
          <option value="">Alla statusar</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </Select>

        <Select
          label="Kund"
          value={filters.customer_id || ''}
          onChange={(e) => onFiltersChange({ ...filters, customer_id: e.target.value || undefined, page: 1 })}
          className="bg-white dark:bg-gray-800"
        >
          <option value="">Alla kunder</option>
          {clients?.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </Select>

        <Input
          label="Sök"
          type="search"
          placeholder="Sök efter titel, nummer..."
          value={filters.search || ''}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value || undefined, page: 1 })}
          className="bg-white dark:bg-gray-800"
        />

        <div className="flex items-end">
          {hasFilters && (
            <Button variant="ghost" onClick={handleClear} className="w-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <X size={16} className="mr-2" />
              Rensa filter
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

