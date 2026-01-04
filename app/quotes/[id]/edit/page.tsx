// app/quotes/[id]/edit/page.tsx
'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuote, useUpdateQuote } from '@/hooks/useQuotes'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import Sidebar from '@/components/Sidebar'
import type { Quote } from '@/types/quotes'

export default function EditQuotePage() {
 const params = useParams()
 const router = useRouter()
 const quoteId = params.id as string

 const { data: quote, isLoading } = useQuote(quoteId)
 const updateMutation = useUpdateQuote(quoteId)

 const handleSubmit = async (data: Partial<Quote>) => {
  await updateMutation.mutateAsync(data)
  router.push(`/quotes/${quoteId}`)
 }

 if (isLoading) {
  return (
   <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar />
    <main className="flex-1 lg:ml-0">
     <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
       <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
       <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
     </div>
    </main>
   </div>
  )
 }

 if (!quote) {
  return (
   <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
    <Sidebar />
    <main className="flex-1 lg:ml-0">
     <div className="container mx-auto px-4 py-8">
      <p className="text-red-600">Offerten hittades inte</p>
     </div>
    </main>
   </div>
  )
 }

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     <div className="mb-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
       Redigera Offert
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">{quote.quote_number}</p>
     </div>

     <QuoteForm 
      quote={quote} 
      onSubmit={handleSubmit} 
      isLoading={updateMutation.isPending} 
     />
    </div>
   </main>
  </div>
 )
}

