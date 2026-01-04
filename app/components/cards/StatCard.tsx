// app/components/cards/StatCard.tsx
'use client'

import React from 'react'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { IconBadge } from '@/components/ui/icon-badge'

interface StatCardProps {
 icon: React.ReactNode
 value: string | number
 label: string
 trend?: {
  value: string
  direction: 'up' | 'down'
 }
 action?: {
  label: string
  onClick: () => void
 }
 iconColor?: 'yellow' | 'blue' | 'green' | 'red'
}

export function StatCard({
 icon,
 value,
 label,
 trend,
 action,
 iconColor = 'blue',
}: StatCardProps) {
 return (
  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
   <div className="flex items-start justify-between">
    {/* Icon Badge */}
    <IconBadge icon={icon} color={iconColor} size="md" />

    {/* Trend indicator */}
    {trend && (
     <div className={`flex items-center gap-1 text-sm font-medium ${
      trend.direction === 'up' ? 'text-success-600' : 'text-error-600'
     }`}>
      <span>{trend.value}</span>
      {trend.direction === 'up' ? (
       <TrendingUp className="w-4 h-4" />
      ) : (
       <TrendingDown className="w-4 h-4" />
      )}
     </div>
    )}
   </div>

   <div className="mt-4">
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{label}</p>
   </div>

   {action && (
    <button
     onClick={action.onClick}
     className="mt-3 flex items-center text-sm text-primary-500 hover:text-primary-600 font-medium transition-colors"
    >
     {action.label}
     <ArrowRight className="ml-1 w-4 h-4" />
    </button>
   )}
  </div>
 )
}
