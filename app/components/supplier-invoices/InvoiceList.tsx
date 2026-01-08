// app/components/supplier-invoices/InvoiceList.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { useSupplierInvoices, useArchiveSupplierInvoice } from '@/hooks/useSupplierInvoices'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Edit, Archive, MoreVertical } from 'lucide-react'
import type { SupplierInvoiceFilters, SupplierInvoiceStatus } from '@/types/supplierInvoices'

interface InvoiceListProps {
 filters: SupplierInvoiceFilters
 onPageChange: (page: number) => void
}

const statusColors: Record<SupplierInvoiceStatus, 'default' | 'warning' | 'info' | 'success' | 'danger'> = {
 draft: 'default',
 pending_approval: 'warning',
 approved: 'info',
 booked: 'info',
 paid: 'success',
 archived: 'default',
 rejected: 'danger'
}

const formatCurrency = (amount: number, currency = 'SEK') => {
 return new Intl.NumberFormat('sv-SE', {
  style: 'currency',
  currency: currency,
  minimumFractionDigits: 2
 }).format(amount)
}

const formatDate = (date: string) => {
 return new Date(date).toLocaleDateString('sv-SE')
}

export function InvoiceList({ filters, onPageChange }: InvoiceListProps) {
 const { data, isLoading, error } = useSupplierInvoices(filters)
 const archiveMutation = useArchiveSupplierInvoice()

 const [menuOpen, setMenuOpen] = React.useState<string | null>(null)

 const handleArchive = async (id: string, invoiceNumber: string) => {
  if (confirm(`Är du säker på att du vill arkivera faktura ${invoiceNumber}?`)) {
   await archiveMutation.mutateAsync(id)
   setMenuOpen(null)
  }
 }

 if (isLoading) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8 text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
    <p className="mt-4 text-gray-600 dark:text-gray-400">Laddar fakturor...</p>
   </div>
  )
 }

 if (error) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8">
    <p className="text-red-600">Ett fel uppstod: {error.message}</p>
   </div>
  )
 }

 const invoices = data?.data || []
 const meta = data?.meta

 if (invoices.length === 0) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
    <p className="text-gray-600 dark:text-gray-400 mb-4">Inga fakturor hittades.</p>
    <Link href="/supplier-invoices/new">
     <Button>Skapa din första faktura</Button>
    </Link>
   </div>
  )
 }

 return (
  <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
   <Table>
    <TableHeader>
     <TableRow>
      <TableHead>Fakturanummer</TableHead>
      <TableHead>Leverantör</TableHead>
      <TableHead>Datum</TableHead>
      <TableHead className="text-right">Belopp</TableHead>
      <TableHead className="text-right">Med påslag</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Åtgärder</TableHead>
     </TableRow>
    </TableHeader>
    <TableBody>
     {invoices.map((invoice) => {
      const billableAmount = invoice.amount_total + invoice.markup_total
      return (
       <TableRow key={invoice.id}>
        <TableCell>
         <Link
          href={`/supplier-invoices/${invoice.id}`}
          className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
         >
          {invoice.invoice_number}
         </Link>
        </TableCell>
        <TableCell>
         <span className="font-medium">{invoice.supplier?.name || '-'}</span>
        </TableCell>
        <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
        <TableCell className="text-right font-semibold">
         {formatCurrency(invoice.amount_total, invoice.currency)}
        </TableCell>
        <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
         {formatCurrency(billableAmount, invoice.currency)}
        </TableCell>
        <TableCell>
         <Badge variant={statusColors[invoice.status]}>
          {invoice.status === 'draft'
           ? 'Utkast'
           : invoice.status === 'pending_approval'
            ? 'Väntar godkännande'
            : invoice.status === 'approved'
             ? 'Godkänd'
             : invoice.status === 'booked'
              ? 'Bokförd'
              : invoice.status === 'paid'
               ? 'Betald'
               : invoice.status === 'rejected'
                ? 'Avvisad'
                : 'Arkiverad'}
         </Badge>
        </TableCell>
        <TableCell className="text-right">
         <div className="relative inline-block">
          <button
           onClick={() => setMenuOpen(menuOpen === invoice.id ? null : invoice.id)}
           className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
           <MoreVertical size={16} />
          </button>
          {menuOpen === invoice.id && (
           <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
            <div className="absolute right-0 mt-2 w-48 bg-gray-50 dark:bg-gray-900 rounded-md shadow-md z-20 border border-gray-200 dark:border-gray-700">
             <Link
              href={`/supplier-invoices/${invoice.id}`}
              className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen(null)}
             >
              <Eye size={16} className="mr-2" />
              Visa
             </Link>
             <Link
              href={`/supplier-invoices/${invoice.id}/edit`}
              className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => setMenuOpen(null)}
             >
              <Edit size={16} className="mr-2" />
              Redigera
             </Link>
             {invoice.status !== 'archived' && (
              <button
               onClick={() => handleArchive(invoice.id, invoice.invoice_number)}
               className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-orange-600"
              >
               <Archive size={16} className="mr-2" />
               Arkivera
              </button>
             )}
            </div>
           </>
          )}
         </div>
        </TableCell>
       </TableRow>
      )
     })}
    </TableBody>
   </Table>

   {/* Pagination */}
   {meta && meta.count > meta.limit && (
    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
     <div className="text-sm text-gray-700 dark:text-gray-300">
      Visar {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.count)} av{' '}
      {meta.count}
     </div>
     <div className="flex gap-2">
      <Button
       variant="outline"
       size="sm"
       disabled={meta.page === 1}
       onClick={() => onPageChange(meta.page - 1)}
      >
       Föregående
      </Button>
      <Button
       variant="outline"
       size="sm"
       disabled={meta.page * meta.limit >= meta.count}
       onClick={() => onPageChange(meta.page + 1)}
      >
       Nästa
      </Button>
     </div>
    </div>
   )}
  </div>
 )
}

