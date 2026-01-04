// app/quotes/new/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCreateQuote } from '@/hooks/useQuotes'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { AIGenerateQuote } from '@/components/quotes/AIGenerateQuote'
import Sidebar from '@/components/Sidebar'
import type { Quote } from '@/types/quotes'
import { toast } from 'sonner'

export default function NewQuotePage() {
 const router = useRouter()
 const createMutation = useCreateQuote()
 const [showAIForm, setShowAIForm] = useState(false)

 const handleSubmit = async (data: Partial<Quote>) => {
  const newQuote = await createMutation.mutateAsync(data)
  router.push(`/quotes/${newQuote.id}/edit`)
 }

 const handleAIGenerate = async (prompt: string, context: any) => {
  try {
   const res = await fetch('/api/quotes/ai-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, context }),
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to generate quote')
   }

   const result = await res.json()
   
   if (result.quote) {
    toast.success('AI-genererad offert skapad!')
    router.push(`/quotes/${result.quote.id}/edit`)
   }
  } catch (error: any) {
   console.error('AI Generate Error:', error)
   toast.error(`Fel: ${error.message}`)
  }
 }

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     <div className="mb-8">
      <div className="flex items-center justify-between">
       <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
         Ny Offert
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
         Skapa en ny offert för din kund
        </p>
       </div>
       <AIGenerateQuote 
        onGenerate={handleAIGenerate}
        isLoading={createMutation.isPending}
       />
      </div>
     </div>

     <QuoteForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
    </div>
   </main>
  </div>
 )
}

