// app/components/ui/empty-state.tsx

/**
 * Empty State Component
 * Based on Claude implementation
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 md:p-12',
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
        <Icon className="w-12 h-12 text-gray-400 dark:text-gray-500" aria-hidden="true" />
      </div>
      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">{description}</p>
      {/* Action Button */}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

