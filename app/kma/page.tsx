// app/kma/page.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useQuotes } from '@/hooks/useQuotes'
import { Leaf, Eye, TrendingUp } from 'lucide-react'

export default function KMAPage() {
 const [search, setSearch] = useState('')

 // Hämta offerter med KMA aktiverat
 const { data, isLoading } = useQuotes()
 
 // Filtrera offerter med kma_enabled = true
 const kmaQuotes = data?.data?.filter((quote: any) => quote.kma_enabled) || []

 // Filtrera baserat på search
 const filteredQuotes = kmaQuotes.filter((quote: any) =>
  quote.title?.toLowerCase().includes(search.toLowerCase()) ||
  quote.quote_number?.toLowerCase().includes(search.toLowerCase())
 )

 // Beräkna statistik
 const totalQuotes = kmaQuotes.length
 const acceptedQuotes = kmaQuotes.filter((q: any) => q.status === 'accepted').length
 const totalValue = kmaQuotes.reduce((sum: number, q: any) => sum + (q.total_amount || 0), 0)

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <div className="flex items-center gap-4 mb-6">
       <div className="p-3 bg-success-500 rounded-lg shadow-md">
        <Leaf size={32} className="text-white" />
       </div>
       <div>
        <h1 className="text-3xl font-bold bg-success-600 hover:bg-success-700 bg-clip-text text-transparent">
         KMA - Kostnads & Miljöanalys
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
         Översikt över offerter med miljöanalys
        </p>
       </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
           Totalt KMA-offerter
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
           {totalQuotes}
          </p>
         </div>
         <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
          <Leaf size={24} className="text-green-600 dark:text-green-400" />
         </div>
        </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
           Accepterade
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
           {acceptedQuotes}
          </p>
         </div>
         <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <TrendingUp size={24} className="text-blue-600 dark:text-blue-400" />
         </div>
        </div>
       </div>

       <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
         <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
           Totalt värde
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
           {totalValue.toLocaleString('sv-SE')} kr
          </p>
         </div>
         <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <TrendingUp size={24} className="text-primary-500 dark:text-primary-400" />
         </div>
        </div>
       </div>
      </div>
     </div>

     {/* Search */}
     <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6 backdrop-blur-sm">
      <Input
       label="Sök offerter"
       type="search"
       placeholder="Sök efter titel eller offertnummer..."
       value={search}
       onChange={(e) => setSearch(e.target.value)}
      />
     </div>

     {/* Loading State */}
     {isLoading && (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-8 text-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
       <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar KMA-offerter...</p>
      </div>
     )}

     {/* Empty State */}
     {!isLoading && filteredQuotes.length === 0 && (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md p-12 text-center">
       <div className="flex justify-center mb-4">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
         <Leaf size={48} className="text-gray-400" />
        </div>
       </div>
       <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Inga KMA-offerter än
       </h3>
       <p className="text-gray-600 dark:text-gray-400 mb-6">
        Aktivera KMA när du skapar en offert för att visa den här
       </p>
       <Link href="/quotes/new">
        <Button size="lg" className="bg-success-600 hover:bg-success-700">
         Skapa Offert med KMA
        </Button>
       </Link>
      </div>
     )}

     {/* KMA Quotes Table */}
     {!isLoading && filteredQuotes.length > 0 && (
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
       <Table>
        <TableHeader>
         <TableRow>
          <TableHead>Offertnummer</TableHead>
          <TableHead>Titel</TableHead>
          <TableHead>Kund</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Åtgärder</TableHead>
         </TableRow>
        </TableHeader>
        <TableBody>
         {filteredQuotes.map((quote: any) => (
          <TableRow key={quote.id}>
           <TableCell>
            <Link
             href={`/quotes/${quote.id}`}
             className="text-blue-600 hover:underline font-medium"
            >
             {quote.quote_number}
            </Link>
           </TableCell>
           <TableCell>
            <div className="flex items-center gap-2">
             <Leaf size={16} className="text-green-600 dark:text-green-400" />
             <span className="font-medium">{quote.title}</span>
            </div>
           </TableCell>
           <TableCell>{quote.customer?.name || '-'}</TableCell>
           <TableCell>
            <Badge
             variant={
              quote.status === 'accepted'
               ? 'success'
               : quote.status === 'draft'
               ? 'default'
               : 'info'
             }
            >
             {quote.status}
            </Badge>
           </TableCell>
           <TableCell className="text-right font-semibold">
            {quote.total_amount?.toLocaleString('sv-SE') || 0} {quote.currency || 'SEK'}
           </TableCell>
           <TableCell className="text-right">
            <Link href={`/quotes/${quote.id}`}>
             <Button variant="ghost" size="sm">
              <Eye size={16} className="mr-2" />
              Visa
             </Button>
            </Link>
           </TableCell>
          </TableRow>
         ))}
        </TableBody>
       </Table>
      </div>
     )}
    </div>
   </main>
  </div>
 )
}

