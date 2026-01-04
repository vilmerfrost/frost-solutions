// app/components/cards/CustomerCard.tsx
'use client'

import React from 'react'
import { Building2, User, Mail, Phone, MapPin, FolderKanban, DollarSign, MoreVertical } from 'lucide-react'

interface CustomerCardProps {
 id: string
 name: string
 type: 'company' | 'person'
 orgNumber?: string
 address?: string
 city?: string
 email?: string
 phone?: string
 contactPerson?: string
 activeProjects?: number
 revenue?: number
 onViewDetails?: () => void
 onEdit?: () => void
}

export function CustomerCard({
 id,
 name,
 type,
 orgNumber,
 address,
 city,
 email,
 phone,
 contactPerson,
 activeProjects,
 revenue,
 onViewDetails,
 onEdit,
}: CustomerCardProps) {
 return (
  <div
   className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer"
   onClick={onViewDetails}
  >
   {/* Header */}
   <div className="flex items-start gap-3 mb-4">
    {/* Icon */}
    <div className="flex-shrink-0">
     <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
      {type === 'company' ? (
       <Building2 className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      ) : (
       <User className="w-6 h-6 text-gray-600 dark:text-gray-400" />
      )}
     </div>
    </div>

    {/* Name and details */}
    <div className="flex-1 min-w-0">
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
      {name}
     </h3>
     {orgNumber && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
       Org.nr: {orgNumber}
      </p>
     )}
    </div>

    {/* More menu */}
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

   {/* Address */}
   {(address || city) && (
    <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
     <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
     <div>
      {address && <div>{address}</div>}
      {city && <div>{city}</div>}
     </div>
    </div>
   )}

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

   {/* Contact person */}
   {contactPerson && (
    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
     <span className="font-medium">Kontaktperson:</span> {contactPerson}
    </div>
   )}

   {/* Stats */}
   <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-600">
    {activeProjects !== undefined && (
     <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-500/20">
       <FolderKanban className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
      <div>
       <div className="text-xs text-gray-500 dark:text-gray-400">Aktiva projekt</div>
       <div className="text-base font-semibold text-gray-900 dark:text-white">{activeProjects}</div>
      </div>
     </div>
    )}
    
    {revenue !== undefined && (
     <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success-50 dark:bg-success-500/20">
       <DollarSign className="w-4 h-4 text-success-600 dark:text-success-400" />
      </div>
      <div>
       <div className="text-xs text-gray-500 dark:text-gray-400">Omsättning</div>
       <div className="text-base font-semibold text-gray-900 dark:text-white">
        {revenue.toLocaleString('sv-SE')} kr
       </div>
      </div>
     </div>
    )}
   </div>
  </div>
 )
}

