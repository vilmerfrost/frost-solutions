// app/quotes/[id]/page.tsx
'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useQuote } from '@/hooks/useQuotes'
import { QuoteDetail } from '@/components/quotes/QuoteDetail'
import Sidebar from '@/components/Sidebar'

export default function QuoteDetailPage() {
  const params = useParams()
  const quoteId = params.id as string

  const { data: quote, isLoading, error } = useQuote(quoteId)

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

  if (error || !quote) {
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          <QuoteDetail quote={quote} />
        </div>
      </main>
    </div>
  )
}

