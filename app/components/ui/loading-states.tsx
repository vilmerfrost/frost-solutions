// app/components/ui/loading-states.tsx
'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'
import { Skeleton } from './skeleton'

// Page Loader - Full page spinner with logo
export function PageLoader({ message = 'Laddar...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
    </div>
  )
}

// Card Skeleton - For card grids
export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Table Skeleton - For table loading
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
      <table className="w-full border-collapse">
        <thead className="bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-4 py-3">
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// List Skeleton - For list items
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-[8px] border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 rounded-[6px]" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Form Skeleton - For form loading
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full rounded-[8px]" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-10 w-32 rounded-[6px]" />
        <Skeleton className="h-10 w-24 rounded-[6px]" />
      </div>
    </div>
  )
}

// Inline Loader - Small spinner for buttons/inline
export function InlineLoader({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }
  
  return (
    <Loader2 className={`${sizes[size]} animate-spin text-primary-500 ${className}`} />
  )
}

// Dashboard Skeleton - Matches dashboard layout
export function DashboardSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-[6px]" />
          <Skeleton className="h-10 w-24 rounded-[6px]" />
        </div>
      </div>

      {/* Weekly schedules skeleton */}
      <Skeleton className="h-64 w-full rounded-lg" />

      {/* TimeClock skeleton */}
      <Skeleton className="h-48 w-full rounded-lg" />

      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>

      {/* New project card skeleton */}
      <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6 lg:p-8">
        <Skeleton className="h-7 w-32 mb-4 sm:mb-6" />
        <Skeleton className="h-10 w-40 rounded-[6px]" />
      </div>

      {/* Projects section skeleton */}
      <div>
        <Skeleton className="h-7 w-24 mb-4 sm:mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5">
              <Skeleton className="h-6 w-3/4 mb-3" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

