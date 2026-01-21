// app/components/ui/table.tsx
'use client'

import React, { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Skeleton } from './skeleton'

interface TableProps {
  children: React.ReactNode
  className?: string
  stickyHeader?: boolean
  isLoading?: boolean
  emptyState?: React.ReactNode
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
  sticky?: boolean
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
  sortable?: boolean
  sorted?: 'asc' | 'desc' | null
  onSort?: () => void
}

export function Table({ 
  children, 
  className = '', 
  stickyHeader = false,
  isLoading = false,
  emptyState
}: TableProps) {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 dark:border-gray-700 sm:rounded-lg">
          <table className={`w-full border-collapse ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  )
}

export function TableHeader({ children, className = '', sticky = false }: TableHeaderProps) {
  return (
    <thead 
      className={`
        bg-white dark:bg-gray-800 border-b-2 border-gray-200 dark:border-gray-700
        ${sticky ? 'sticky top-0 z-10 shadow-sm' : ''}
        ${className}
      `}
    >
      {children}
    </thead>
  )
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:border-gray-800">{children}</tbody>
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <tr 
      className={`
        border-b border-gray-100 dark:border-gray-800 
        hover:bg-gray-50 dark:hover:bg-gray-700 
        transition-colors duration-150
        ${className}
      `}
    >
      {children}
    </tr>
  )
}

export function TableHead({ 
  children, 
  className = '', 
  sortable = false,
  sorted = null,
  onSort
}: TableHeadProps) {
  if (sortable) {
    return (
      <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 ${className}`}>
        <button
          onClick={onSort}
          className="flex items-center gap-1 hover:text-primary-500 transition-colors group"
        >
          {children}
          {sorted === null && (
            <ArrowUpDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          )}
          {sorted === 'asc' && (
            <ArrowUp className="w-4 h-4 text-primary-500" />
          )}
          {sorted === 'desc' && (
            <ArrowDown className="w-4 h-4 text-primary-500" />
          )}
        </button>
      </th>
    )
  }

  return (
    <th className={`px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 ${className}`}>
      {children}
    </th>
  )
}

export function TableCell({ children, className = '', colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return (
    <td className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-100 ${className}`} colSpan={colSpan}>
      {children}
    </td>
  )
}

// Table skeleton for loading states
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {Array.from({ length: columns }).map((_, i) => (
            <TableHead key={i}>
              <Skeleton className="h-4 w-24" />
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <TableRow key={rowIndex}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <TableCell key={colIndex}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
