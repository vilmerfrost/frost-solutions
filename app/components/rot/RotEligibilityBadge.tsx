// app/components/rot/RotEligibilityBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RotEligibilityBadgeProps {
 eligible: boolean;
 reason?: string;
 className?: string;
}

export function RotEligibilityBadge({
 eligible,
 reason,
 className,
}: RotEligibilityBadgeProps) {
 const config = eligible
  ? {
    label: '✅ Berättigad',
    variant: 'success' as const,
   }
  : {
    label: `❌ Ej berättigad${reason ? `: ${reason}` : ''}`,
    variant: 'danger' as const,
   };

 return (
  <Badge
   variant={config.variant}
   className={cn('font-medium', className)}
   aria-label={config.label}
  >
   {config.label}
  </Badge>
 );
}

