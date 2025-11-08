// app/quotes/new/page.tsx
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useCreateQuote } from '@/hooks/useQuotes'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import Sidebar from '@/components/Sidebar'
import type { Quote } from '@/types/quotes'

export default function NewQuotePage() {
  const router = useRouter()
  const createMutation = useCreateQuote()

  const handleSubmit = async (data: Partial<Quote>) => {
    const newQuote = await createMutation.mutateAsync(data)
    router.push(`/quotes/${newQuote.id}/edit`)
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Ny Offert
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Skapa en ny offert för din kund</p>
          </div>

          <QuoteForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
        </div>
      </main>
    </div>
  )
}

