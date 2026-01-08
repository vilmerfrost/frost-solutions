// app/components/quotes/QuoteDetail.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QuoteStatusBadge } from './QuoteStatusBadge'
import { QuoteActions } from './QuoteActions'
import { QuoteItemsList } from './QuoteItemsList'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit } from 'lucide-react'
import type { Quote } from '@/types/quotes'

interface QuoteDetailProps {
 quote: Quote
}

export function QuoteDetail({ quote }: QuoteDetailProps) {
 const router = useRouter()

 return (
  <div className="space-y-6">
   {/* Header */}
   <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 dark:bg-gray-800/30 rounded-[8px] shadow-xl border-2 border-emerald-300 dark:border-emerald-700 p-6 backdrop-blur-sm">
    <div className="flex items-center gap-4">
     <Button 
      variant="ghost" 
      onClick={() => {
        // Try to go back, fallback to quotes list
        if (window.history.length > 1) {
          router.back()
        } else {
          router.push('/quotes')
        }
      }} 
      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <ArrowLeft size={16} className="mr-2" />
      Tillbaka
     </Button>
     <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
       {quote.quote_number}
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">{quote.title}</p>
     </div>
    </div>
    <div className="flex items-center gap-3">
     <QuoteStatusBadge status={quote.status} />
     <Link href={`/quotes/${quote.id}/edit`}>
      <Button variant="outline" className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
       <Edit size={16} className="mr-2" />
       Redigera
      </Button>
     </Link>
    </div>
   </div>

   {/* Actions */}
   <QuoteActions quote={quote} />

   {/* Basic Info */}
   <div className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-800/30 rounded-[8px] shadow-xl border-2 border-blue-200 dark:border-blue-700 p-6 backdrop-blur-sm">
    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
     Information
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <div>
      <label className="text-sm text-gray-500">Kund</label>
      <p className="font-medium">{quote.customer?.name || '-'}</p>
     </div>
     <div>
      <label className="text-sm text-gray-500">Projekt</label>
      <p className="font-medium">{quote.project?.name || '-'}</p>
     </div>
     <div>
      <label className="text-sm text-gray-500">Skapad</label>
      <p className="font-medium">{new Date(quote.created_at).toLocaleDateString('sv-SE')}</p>
     </div>
     <div>
      <label className="text-sm text-gray-500">Giltig till</label>
      <p className="font-medium">{quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('sv-SE') : '-'}</p>
     </div>
     {quote.opened_at && (
      <div>
       <label className="text-sm text-gray-500">Visad</label>
       <p className="font-medium">{new Date(quote.opened_at).toLocaleDateString('sv-SE')}</p>
      </div>
     )}
    </div>

    {quote.notes && (
     <div className="mt-4">
      <label className="text-sm text-gray-500">Anteckningar</label>
      <p className="mt-1">{quote.notes}</p>
     </div>
    )}

    {quote.kma_enabled && (
     <div className="mt-4 pt-4 border-t">
      <p className="text-sm text-gray-500">KMA aktiverad</p>
     </div>
    )}
   </div>

   {/* Items */}
   <QuoteItemsList quoteId={quote.id} />

   {/* Totals */}
   <div className="bg-gray-50 dark:bg-gray-900 dark:bg-gray-800/30 rounded-[8px] shadow-xl border-2 border-primary-200 dark:border-primary-700 p-6 backdrop-blur-sm">
    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
     Summering
    </h2>
    <div className="flex flex-col items-end space-y-2 bg-primary-500 hover:bg-primary-600 dark:to-transparent p-4 rounded-lg">
     <div className="flex justify-between w-64">
      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
      <span className="font-medium">{quote.subtotal.toLocaleString('sv-SE')} {quote.currency}</span>
     </div>
     <div className="flex justify-between w-64">
      <span className="text-gray-600 dark:text-gray-400">Rabatt:</span>
      <span className="font-medium text-red-600 dark:text-red-400">-{quote.discount_amount.toLocaleString('sv-SE')} {quote.currency}</span>
     </div>
     <div className="flex justify-between w-64">
      <span className="text-gray-600 dark:text-gray-400">Moms:</span>
      <span className="font-medium">{quote.tax_amount.toLocaleString('sv-SE')} {quote.currency}</span>
     </div>
     <div className="flex justify-between w-64 text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
      <span>Total:</span>
      <span className="text-gray-900 dark:text-white">
       {quote.total_amount.toLocaleString('sv-SE')} {quote.currency}
      </span>
     </div>
    </div>
   </div>
  </div>
 )
}

