// app/components/quotes/QuoteList.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useQuotes, useDeleteQuote } from '@/hooks/useQuotes'
import { useDuplicateQuote } from '@/hooks/useQuoteActions'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { QuoteStatusBadge } from './QuoteStatusBadge'
import { MoreVertical, Eye, Edit, Copy, Trash2 } from 'lucide-react'
import type { QuoteFilters } from '@/types/quotes'

interface QuoteListProps {
 filters: QuoteFilters
 onPageChange: (page: number) => void
}

export function QuoteList({ filters, onPageChange }: QuoteListProps) {
 const { data, isLoading, error } = useQuotes(filters)
 const deleteMutation = useDeleteQuote()
 const duplicateMutation = useDuplicateQuote()

 const [menuOpen, setMenuOpen] = React.useState<string | null>(null)

 if (isLoading) {
  return (
   <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95">
    <div className="p-8 text-center">
     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
     <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar offerter...</p>
    </div>
   </div>
  )
 }

 if (error) {
  return (
   <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl border border-red-200 dark:border-red-800 p-8 backdrop-blur-sm bg-opacity-95">
    <p className="text-red-600 dark:text-red-400">Ett fel uppstod: {error.message}</p>
   </div>
  )
 }

 const quotes = data?.data || []
 const meta = data?.meta

 if (quotes.length === 0) {
  return (
   <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center backdrop-blur-sm bg-opacity-95">
    <div className="max-w-md mx-auto">
     <div className="text-6xl mb-4">📄</div>
     <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Inga offerter hittades</h3>
     <p className="text-gray-600 dark:text-gray-400 mb-6">Justera dina filter eller skapa din första offert</p>
     <Link href="/quotes/new">
      <Button className="bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md hover:shadow-xl transition-all duration-200">
       Skapa din första offert
      </Button>
     </Link>
    </div>
   </div>
  )
 }

 const handleDelete = async (id: string, quoteNumber: string) => {
  if (confirm(`Är du säker på att du vill radera offert ${quoteNumber}?`)) {
   await deleteMutation.mutateAsync(id)
  }
 }

 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm bg-opacity-95">
   <Table>
    <TableHeader>
     <TableRow className="bg-primary-500 hover:bg-primary-600 dark:from-gray-800 dark:to-gray-700">
      <TableHead className="font-semibold">Offertnummer</TableHead>
      <TableHead className="font-semibold">Titel</TableHead>
      <TableHead className="font-semibold">Kund</TableHead>
      <TableHead className="font-semibold">Status</TableHead>
      <TableHead className="font-semibold">Total</TableHead>
      <TableHead className="font-semibold">Skapad</TableHead>
      <TableHead className="text-right font-semibold">Åtgärder</TableHead>
     </TableRow>
    </TableHeader>
    <TableBody>
     {quotes.map((quote) => (
      <TableRow key={quote.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200">
       <TableCell>
        <Link href={`/quotes/${quote.id}`} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline font-medium transition-colors">
         {quote.quote_number}
        </Link>
       </TableCell>
       <TableCell className="font-medium">{quote.title}</TableCell>
       <TableCell>{quote.customer?.name || '-'}</TableCell>
       <TableCell>
        <QuoteStatusBadge status={quote.status} />
       </TableCell>
       <TableCell className="font-semibold">
        {quote.total_amount.toLocaleString('sv-SE')} {quote.currency}
       </TableCell>
       <TableCell>
        {new Date(quote.created_at).toLocaleDateString('sv-SE')}
       </TableCell>
       <TableCell className="text-right">
        <div className="relative inline-block">
         <button
          onClick={() => setMenuOpen(menuOpen === quote.id ? null : quote.id)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
         >
          <MoreVertical size={16} />
         </button>
         
         {menuOpen === quote.id && (
          <>
           <div 
            className="fixed inset-0 z-10" 
            onClick={() => setMenuOpen(null)}
           />
           <div className="absolute right-0 mt-2 w-48 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
            <Link 
             href={`/quotes/${quote.id}`}
             className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
             onClick={() => setMenuOpen(null)}
            >
             <Eye size={16} className="mr-2" />
             Visa
            </Link>
            <Link 
             href={`/quotes/${quote.id}/edit`}
             className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
             onClick={() => setMenuOpen(null)}
            >
             <Edit size={16} className="mr-2" />
             Redigera
            </Link>
            <button
             onClick={() => {
              duplicateMutation.mutate(quote.id)
              setMenuOpen(null)
             }}
             disabled={duplicateMutation.isPending}
             className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-left disabled:opacity-50 transition-colors"
            >
             <Copy size={16} className="mr-2" />
             Duplicera
            </button>
            <button
             onClick={() => {
              handleDelete(quote.id, quote.quote_number)
              setMenuOpen(null)
             }}
             className="flex items-center w-full px-4 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-left transition-colors"
            >
             <Trash2 size={16} className="mr-2" />
             Radera
            </button>
           </div>
          </>
         )}
        </div>
       </TableCell>
      </TableRow>
     ))}
    </TableBody>
   </Table>
   
   {/* Pagination */}
   {meta && meta.count > meta.limit && (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
     <div className="text-sm text-gray-700 dark:text-gray-300">
      Visar {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.count)} av {meta.count}
     </div>
     <div className="flex gap-2">
      <Button
       variant="outline"
       size="sm"
       disabled={meta.page === 1}
       onClick={() => onPageChange(meta.page - 1)}
       className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
       Föregående
      </Button>
      <Button
       variant="outline"
       size="sm"
       disabled={meta.page * meta.limit >= meta.count}
       onClick={() => onPageChange(meta.page + 1)}
       className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
       Nästa
      </Button>
     </div>
    </div>
   )}
  </div>
 )
}

