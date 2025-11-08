// app/components/quotes/QuoteStatusBadge.tsx
import React from 'react'
import { Badge } from '@/components/ui/badge'
import type { QuoteStatus } from '@/types/quotes'

interface QuoteStatusBadgeProps {
  status: QuoteStatus
}

const statusConfig: Record<QuoteStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Utkast', variant: 'default' },
  pending_approval: { label: 'Väntar godkännande', variant: 'warning' },
  approved: { label: 'Godkänd', variant: 'success' },
  sent: { label: 'Skickad', variant: 'info' },
  viewed: { label: 'Visad', variant: 'info' },
  accepted: { label: 'Accepterad', variant: 'success' },
  rejected: { label: 'Avvisad', variant: 'danger' },
  expired: { label: 'Utgången', variant: 'warning' },
  archived: { label: 'Arkiverad', variant: 'default' }
}

export function QuoteStatusBadge({ status }: QuoteStatusBadgeProps) {
  const config = statusConfig[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}

