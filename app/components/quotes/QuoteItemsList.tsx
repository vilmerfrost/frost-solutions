// app/components/quotes/QuoteItemsList.tsx
'use client'

import React from 'react'
import { useQuoteItems } from '@/hooks/useQuoteItems'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

interface QuoteItemsListProps {
  quoteId: string
}

export function QuoteItemsList({ quoteId }: QuoteItemsListProps) {
  const { data: items, isLoading } = useQuoteItems(quoteId)

  if (isLoading) {
    return <div className="bg-white rounded-lg shadow p-6">Laddar artiklar...</div>
  }

  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-center">Inga artiklar i denna offert</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-sm bg-opacity-95">
      <h2 className="text-xl font-semibold mb-4 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">
        Artiklar
      </h2>
      <Table>
        <TableHeader>
          <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700">
            <TableHead className="font-semibold">Namn</TableHead>
            <TableHead className="font-semibold">Antal</TableHead>
            <TableHead className="font-semibold">Enhet</TableHead>
            <TableHead className="font-semibold">Pris/enhet</TableHead>
            <TableHead className="font-semibold">Rabatt</TableHead>
            <TableHead className="font-semibold">Moms</TableHead>
            <TableHead className="text-right font-semibold">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-transparent dark:hover:from-gray-700 dark:hover:to-transparent transition-all duration-200">
              <TableCell>
                <div>
                  <div className="font-medium">{item.name}</div>
                  {item.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{item.description}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>{item.unit_price.toLocaleString('sv-SE')} kr</TableCell>
              <TableCell>{item.discount}%</TableCell>
              <TableCell>{item.vat_rate}%</TableCell>
              <TableCell className="text-right font-medium">
                {item.line_total?.toLocaleString('sv-SE') || '0'} kr
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

