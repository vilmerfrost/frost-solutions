// app/components/supplier-invoices/InvoiceHistoryTimeline.tsx
'use client'

import React from 'react'
import { FileText, Edit, CheckCircle, XCircle, Archive, DollarSign, Clock } from 'lucide-react'
import type { SupplierInvoiceHistory } from '@/types/supplierInvoices'

interface InvoiceHistoryTimelineProps {
 history: SupplierInvoiceHistory[]
}

const eventIcons: Record<string, any> = {
 created: FileText,
 updated: Edit,
 approved: CheckCircle,
 rejected: XCircle,
 paid: DollarSign,
 archived: Archive,
 ocr_scanned: FileText,
 markup_applied: DollarSign,
 converted: FileText
}

const eventColors: Record<string, string> = {
 created: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
 updated: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
 approved: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
 rejected: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
 paid: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
 archived: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
 ocr_scanned: 'bg-purple-100 text-primary-500 dark:bg-purple-900/30 dark:text-primary-400',
 markup_applied: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
 converted: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
}

const eventLabels: Record<string, string> = {
 created: 'Faktura skapad',
 updated: 'Faktura uppdaterad',
 approved: 'Faktura godkänd',
 rejected: 'Faktura avvisad',
 paid: 'Betalning registrerad',
 archived: 'Faktura arkiverad',
 ocr_scanned: 'OCR-igenkänning utförd',
 markup_applied: 'Påslag tillämpat',
 converted: 'Konverterad till kundfaktura'
}

const formatDateTime = (date: string) => {
 return new Date(date).toLocaleString('sv-SE', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
 })
}

export function InvoiceHistoryTimeline({ history }: InvoiceHistoryTimelineProps) {
 if (!history || history.length === 0) {
  return (
   <div className="text-center py-8 text-gray-500 dark:text-gray-400">
    Ingen historik tillgänglig
   </div>
  )
 }

 // Sortera i omvänd kronologisk ordning (nyaste först)
 const sortedHistory = [...history].sort(
  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
 )

 return (
  <div className="relative">
   {/* Timeline line */}
   <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

   {/* Events */}
   <div className="space-y-6">
    {sortedHistory.map((event) => {
     const Icon = eventIcons[event.action] || Clock
     const colorClass = eventColors[event.action] || eventColors.updated
     const label = eventLabels[event.action] || event.action

     return (
      <div key={event.id} className="relative pl-16">
       {/* Icon */}
       <div
        className={`absolute left-0 w-12 h-12 rounded-full ${colorClass} flex items-center justify-center shadow-md`}
       >
        <Icon size={20} />
       </div>

       {/* Content */}
       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-2">
         <h4 className="font-semibold text-gray-900 dark:text-white">{label}</h4>
         <span className="text-xs text-gray-500 dark:text-gray-400">
          {formatDateTime(event.created_at)}
         </span>
        </div>

        {event.data && Object.keys(event.data).length > 0 && (
         <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mt-2">
          <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
           {JSON.stringify(event.data, null, 2)}
          </pre>
         </div>
        )}
       </div>
      </div>
     )
    })}
   </div>
  </div>
 )
}

