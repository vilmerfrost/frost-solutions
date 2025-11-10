// app/components/factoring/FactoringStatusBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FactoringOfferStatus } from '@/types/factoring';
import { Clock, CheckCircle, XCircle, Banknote, AlertCircle } from 'lucide-react';

interface FactoringStatusBadgeProps {
  status: FactoringOfferStatus;
  className?: string;
}

const statusConfig: Record<
  FactoringOfferStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'danger'; icon: typeof Clock }
> = {
  pending: {
    label: 'Väntande',
    variant: 'warning',
    icon: Clock,
  },
  offered: {
    label: 'Erbjudande',
    variant: 'info',
    icon: AlertCircle,
  },
  accepted: {
    label: 'Accepterad',
    variant: 'success',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Nekad',
    variant: 'danger',
    icon: XCircle,
  },
  failed: {
    label: 'Misslyckad',
    variant: 'danger',
    icon: XCircle,
  },
};

export function FactoringStatusBadge({
  status,
  className,
}: FactoringStatusBadgeProps) {
  const config = statusConfig[status] || {
    label: 'Okänd',
    variant: 'default' as const,
    icon: AlertCircle,
  };
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn('flex items-center gap-1.5 font-medium', className)}
      aria-live="polite"
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

