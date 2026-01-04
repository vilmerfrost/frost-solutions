// app/components/supplier-invoices/InvoiceItemsTable.tsx
'use client'

import React from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { SupplierInvoiceItem } from '@/types/supplierInvoices'

interface InvoiceItemsTableProps {
 items: SupplierInvoiceItem[]
 currency: string
}

const itemTypeColors = {
 material: 'default',
 labor: 'info',
 transport: 'warning',
 other: 'default'
}

const itemTypeLabels = {
 material: 'Material',
 labor: 'Arbetskostnad',
 transport: 'Transport',
 other: 'Övrigt'
}

export function InvoiceItemsTable({ items, currency }: InvoiceItemsTableProps) {
 if (!items || items.length === 0) {
  return (
   <div className="text-center py-8 text-gray-500 dark:text-gray-400">
    Inga artiklar i denna faktura
   </div>
  )
 }

 return (
  <Table>
   <TableHeader>
    <TableRow>
     <TableHead>Typ</TableHead>
     <TableHead>Namn</TableHead>
     <TableHead>Beskrivning</TableHead>
     <TableHead className="text-right">Antal</TableHead>
     <TableHead>Enhet</TableHead>
     <TableHead className="text-right">Pris/enhet</TableHead>
     <TableHead className="text-right">Moms</TableHead>
     <TableHead className="text-right">Total</TableHead>
    </TableRow>
   </TableHeader>
   <TableBody>
    {items.map((item) => (
     <TableRow key={item.id}>
      <TableCell>
       <Badge variant={itemTypeColors[item.item_type]}>
        {itemTypeLabels[item.item_type]}
       </Badge>
      </TableCell>
      <TableCell>
       <span className="font-medium text-gray-900 dark:text-white">{item.name}</span>
      </TableCell>
      <TableCell>
       <span className="text-sm text-gray-600 dark:text-gray-400">{item.description || '-'}</span>
      </TableCell>
      <TableCell className="text-right">{item.quantity}</TableCell>
      <TableCell>{item.unit}</TableCell>
      <TableCell className="text-right">
       {item.unit_price.toLocaleString('sv-SE')} {currency}
      </TableCell>
      <TableCell className="text-right">{item.vat_rate}%</TableCell>
      <TableCell className="text-right font-semibold text-emerald-600 dark:text-emerald-400">
       {item.line_total.toLocaleString('sv-SE')} {currency}
      </TableCell>
     </TableRow>
    ))}
   </TableBody>
  </Table>
 )
}

