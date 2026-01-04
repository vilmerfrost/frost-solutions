// app/components/ui/empty-state.tsx
'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { IconBadge } from './icon-badge'

interface EmptyStateAction {
  label: string
  onClick: () => void
  icon?: React.ReactNode
}

interface EmptyStateProps {
  icon: React.ReactNode
  iconColor?: 'yellow' | 'blue' | 'green' | 'red'
  title: string
  description: string
  action?: EmptyStateAction
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  illustration?: React.ReactNode
  className?: string
}

export function EmptyState({
  icon,
  iconColor = 'yellow',
  title,
  description,
  action,
  secondaryAction,
  illustration,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-4',
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">{illustration}</div>
      ) : (
        <IconBadge icon={icon} color={iconColor} size="lg" className="mb-6" />
      )}
      
      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
        {description}
      </p>
      
      {/* Primary Action Button */}
      {action && (
        <Button 
          onClick={action.onClick} 
          variant="primary"
          icon={action.icon}
        >
          {action.label}
        </Button>
      )}
      
      {/* Secondary Action Link */}
      {secondaryAction && (
        <button
          onClick={secondaryAction.onClick}
          className="mt-3 text-sm text-primary-500 hover:text-primary-600 hover:underline transition-colors"
        >
          {secondaryAction.label}
        </button>
      )}
    </div>
  )
}
