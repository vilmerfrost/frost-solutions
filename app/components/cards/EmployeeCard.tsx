// app/components/cards/EmployeeCard.tsx
'use client'

import React from 'react'
import { Mail, Phone, ArrowRight, Clock, DollarSign } from 'lucide-react'

interface EmployeeCardProps {
 id: string
 name: string
 role: 'admin' | 'member'
 status: 'active' | 'inactive'
 email?: string
 phone?: string
 avatar?: string | null
 hours?: number
 rate?: number
 onViewProfile?: () => void
}

export function EmployeeCard({
 id,
 name,
 role,
 status,
 email,
 phone,
 avatar,
 hours,
 rate,
 onViewProfile,
}: EmployeeCardProps) {
 const getInitials = (name: string) => {
  return name
   .split(' ')
   .map(part => part[0])
   .join('')
   .toUpperCase()
   .slice(0, 2)
 }

 const roleBadgeConfig = {
  admin: {
   bg: 'bg-primary-50 dark:bg-primary-500/20',
   text: 'text-primary-700 dark:text-primary-400',
   label: 'Admin',
  },
  member: {
   bg: 'bg-gray-100 dark:bg-gray-600',
   text: 'text-gray-700 dark:text-gray-300',
   label: 'Medlem',
  },
 }

 const statusConfig = {
  active: {
   dot: 'bg-success-500',
   text: 'text-success-600 dark:text-success-400',
   label: 'Aktiv',
  },
  inactive: {
   dot: 'bg-gray-400',
   text: 'text-gray-600 dark:text-gray-400',
   label: 'Inaktiv',
  },
 }

 const roleBadge = roleBadgeConfig[role]
 const statusStyle = statusConfig[status]

 return (
  <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5 hover:shadow-md transition-shadow duration-200">
   {/* Header with avatar */}
   <div className="flex items-start gap-3 mb-4">
    {/* Avatar */}
    <div className="flex-shrink-0">
     {avatar ? (
      <img
       src={avatar}
       alt={name}
       className="w-10 h-10 rounded-full object-cover"
      />
     ) : (
      <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-500/20 flex items-center justify-center">
       <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
        {getInitials(name)}
       </span>
      </div>
     )}
    </div>

    {/* Name and badges */}
    <div className="flex-1 min-w-0">
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
      {name}
     </h3>
     <div className="flex flex-wrap gap-2 mt-1">
      <span className={`${roleBadge.bg} ${roleBadge.text} px-2 py-0.5 rounded-full text-xs font-medium`}>
       {roleBadge.label}
      </span>
      <div className="flex items-center gap-1">
       <div className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
       <span className={`text-xs font-medium ${statusStyle.text}`}>
        {statusStyle.label}
       </span>
      </div>
     </div>
    </div>
   </div>

   {/* Contact info */}
   <div className="space-y-2 mb-4">
    {email && (
     <a
      href={`mailto:${email}`}
      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      onClick={(e) => e.stopPropagation()}
     >
      <Mail className="w-4 h-4 flex-shrink-0" />
      <span className="truncate">{email}</span>
     </a>
    )}
    
    {phone && (
     <a
      href={`tel:${phone}`}
      className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      onClick={(e) => e.stopPropagation()}
     >
      <Phone className="w-4 h-4 flex-shrink-0" />
      <span>{phone}</span>
     </a>
    )}
   </div>

   {/* Stats */}
   {(hours !== undefined || rate !== undefined) && (
    <div className="grid grid-cols-2 gap-4 mb-4">
     {hours !== undefined && (
      <div>
       <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
        <Clock className="w-3.5 h-3.5" />
        <span className="text-xs">Timmar/månad</span>
       </div>
       <div className="text-lg font-medium text-gray-900 dark:text-white">
        {hours}h
       </div>
      </div>
     )}
     
     {rate !== undefined && (
      <div>
       <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
        <DollarSign className="w-3.5 h-3.5" />
        <span className="text-xs">Timpris</span>
       </div>
       <div className="text-lg font-medium text-gray-900 dark:text-white">
        {rate} kr
       </div>
      </div>
     )}
    </div>
   )}

   {/* View profile link */}
   <button
    onClick={onViewProfile}
    className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium flex items-center justify-center gap-1 group mt-2"
   >
    Visa profil
    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
   </button>
  </div>
 )
}

