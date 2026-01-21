// app/components/ai/AiCostBadge.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AiCostBadgeProps {
 tokens: number;
 cost: number;
 className?: string;
}

export function AiCostBadge({ tokens, cost, className }: AiCostBadgeProps) {
 const costFormatter = new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: 'SEK',
  minimumFractionDigits: 3,
 });

 const colorClass =
  cost > 0.5
   ? 'bg-red-100 text-red-800'
   : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300';

 return (
  <Badge
   variant="default"
   className={cn(
    'text-xs font-mono border-gray-300 dark:border-gray-600',
    colorClass,
    className
   )}
   aria-label={`AI-kostnad: ${tokens} tokens, ${costFormatter.format(cost)}`}
  >
   {tokens} tokens (~{costFormatter.format(cost)})
  </Badge>
 );
}

