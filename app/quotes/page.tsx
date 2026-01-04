// app/quotes/page.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuoteList } from '@/components/quotes/QuoteList'
import { QuoteFilters } from '@/components/quotes/QuoteFilters'
import Sidebar from '@/components/Sidebar'
import type { QuoteFilters as IQuoteFilters } from '@/types/quotes'

export default function QuotesPage() {
 const [filters, setFilters] = useState<IQuoteFilters>({
  page: 1,
  limit: 20
 })

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     <div className="flex items-center justify-between mb-6">
      <div>
       <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Offerter
       </h1>
       <p className="text-gray-600 dark:text-gray-400 mt-1">Hantera alla dina offerter på ett ställe</p>
      </div>
      <Link href="/quotes/new">
       <Button className="bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md hover:shadow-xl transition-all duration-200">
        <Plus size={20} className="mr-2" />
        Ny Offert
       </Button>
      </Link>
     </div>
     <QuoteFilters filters={filters} onFiltersChange={setFilters} />
     
     <QuoteList filters={filters} onPageChange={(page) => setFilters({ ...filters, page })} />
    </div>
   </main>
  </div>
 )
}

