// app/components/cards/ProjectCard.tsx
'use client'

import React from 'react'
import { Users, Calendar, DollarSign, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ProjectStatus = 'active' | 'planned' | 'completed'

interface ProjectCardProps {
 name: string
 customer?: string
 status: ProjectStatus
 budget: {
  hours: number
  used: number
  amount?: number
 }
 stats?: {
  employees?: number
  daysLeft?: number
  revenue?: number
 }
 createdAt?: string
 updatedAt?: string
 onViewDetails?: () => void
 onEdit?: () => void
}

const statusConfig = {
 active: {
  label: 'Pågående',
  borderColor: 'border-l-success-500',
  badgeBg: 'bg-success-50 dark:bg-success-500/20',
  badgeText: 'text-success-700 dark:text-success-400',
 },
 planned: {
  label: 'Planerad',
  borderColor: 'border-l-info-500',
  badgeBg: 'bg-info-50 dark:bg-info-500/20',
  badgeText: 'text-info-700 dark:text-info-400',
 },
 completed: {
  label: 'Avslutat',
  borderColor: 'border-l-gray-400',
  badgeBg: 'bg-gray-50 dark:bg-gray-500/20',
  badgeText: 'text-gray-700 dark:text-gray-400',
 },
}

export function ProjectCard({
 name,
 customer,
 status,
 budget,
 stats,
 createdAt,
 updatedAt,
 onViewDetails,
 onEdit,
}: ProjectCardProps) {
 const statusStyle = statusConfig[status]
 const percentage = budget.hours > 0 ? (budget.used / budget.hours) * 100 : 0
 const cappedPercentage = Math.min(percentage, 100)

 // Determine progress bar color
 const getProgressColor = () => {
  if (percentage >= 100) return 'bg-success-500'
  if (percentage >= 90) return 'bg-error-500'
  if (percentage >= 70) return 'bg-warning-500'
  return 'bg-primary-500'
 }

 return (
  <div
   className={`bg-white dark:bg-gray-700 rounded-[8px] border-l-4 ${statusStyle.borderColor} border border-gray-200 dark:border-gray-600 p-6 hover:shadow-md hover:-translate-y-[2px] transition-all duration-200 cursor-pointer`}
   onClick={onViewDetails}
  >
   {/* Header */}
   <div className="flex items-start justify-between mb-3">
    <div className="flex-1 min-w-0">
     <h3 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
      {name}
     </h3>
     {customer && (
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
       {customer}
      </p>
     )}
    </div>
    
    <div className="flex items-center gap-2 ml-3">
     <span className={`${statusStyle.badgeBg} ${statusStyle.badgeText} px-3 py-1 rounded-full text-xs font-medium`}>
      {statusStyle.label}
     </span>
     <button
      onClick={(e) => {
       e.stopPropagation()
       onEdit?.()
      }}
      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
     >
      <MoreVertical className="w-4 h-4 text-gray-400" />
     </button>
    </div>
   </div>

   {/* Progress section */}
   <div className="mb-4">
    <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
     <span>Budget</span>
     <span className={percentage > 100 ? 'text-error-600 dark:text-error-400 font-semibold' : ''}>
      {percentage.toFixed(0)}%
     </span>
    </div>
    
    {/* Progress bar */}
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
     <div
      className={`h-2 rounded-full ${getProgressColor()} transition-all duration-300`}
      style={{ width: `${cappedPercentage}%` }}
     />
    </div>
    
    {/* Budget details */}
    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
     {budget.used}h / {budget.hours}h
     {budget.amount && ` • ${budget.amount.toLocaleString('sv-SE')} kr`}
    </div>
    
    {percentage > 100 && (
     <p className="text-xs text-error-600 dark:text-error-400 mt-1 font-medium">
      ⚠️ Över budget med {(percentage - 100).toFixed(0)}%
     </p>
    )}
   </div>

   {/* Stats pills */}
   {stats && (
    <div className="flex flex-wrap gap-3 mb-4">
     {stats.employees !== undefined && (
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-[6px] px-3 py-2">
       <Users className="w-4 h-4 text-gray-500 dark:text-gray-400" />
       <span className="text-sm text-gray-700 dark:text-gray-300">{stats.employees} anställda</span>
      </div>
     )}
     
     {stats.daysLeft !== undefined && (
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-[6px] px-3 py-2">
       <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
       <span className="text-sm text-gray-700 dark:text-gray-300">{stats.daysLeft} dagar kvar</span>
      </div>
     )}
     
     {stats.revenue !== undefined && (
      <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-[6px] px-3 py-2">
       <DollarSign className="w-4 h-4 text-gray-500 dark:text-gray-400" />
       <span className="text-sm text-gray-700 dark:text-gray-300">{stats.revenue.toLocaleString('sv-SE')} kr/h</span>
      </div>
     )}
    </div>
   )}

   {/* Action buttons */}
   <div className="flex gap-2">
    <Button
     variant="primary"
     size="sm"
     onClick={(e) => {
      e.stopPropagation()
      onViewDetails?.()
     }}
     className="flex-1"
    >
     Skapa läckor
    </Button>
    <Button
     variant="secondary"
     size="sm"
     onClick={(e) => {
      e.stopPropagation()
      // Add details action
     }}
    >
     Visa detaljer
    </Button>
   </div>

   {/* Footer */}
   {(createdAt || updatedAt) && (
    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500">
     {createdAt && <span>Skapad: {createdAt}</span>}
     {createdAt && updatedAt && <span className="mx-2">•</span>}
     {updatedAt && <span>Uppdaterad: {updatedAt}</span>}
    </div>
   )}
  </div>
 )
}

