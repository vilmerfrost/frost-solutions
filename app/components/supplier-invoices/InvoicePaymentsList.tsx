// app/components/supplier-invoices/InvoicePaymentsList.tsx
'use client'

import React from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'
import type { SupplierInvoicePayment } from '@/types/supplierInvoices'

interface InvoicePaymentsListProps {
  payments: SupplierInvoicePayment[]
  currency: string
  amountPaid: number
  amountRemaining: number
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('sv-SE')
}

export function InvoicePaymentsList({
  payments,
  currency,
  amountPaid,
  amountRemaining
}: InvoicePaymentsListProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        Inga betalningar registrerade ännu
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Payments Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Betalningsdatum</TableHead>
            <TableHead>Metod</TableHead>
            <TableHead className="text-right">Belopp</TableHead>
            <TableHead>Noteringar</TableHead>
            <TableHead>Registrerad</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{formatDate(payment.payment_date)}</TableCell>
              <TableCell>
                <Badge variant="default">{payment.method}</Badge>
              </TableCell>
              <TableCell className="text-right font-semibold text-green-600 dark:text-green-400">
                {payment.amount.toLocaleString('sv-SE')} {currency}
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                {payment.notes || '-'}
              </TableCell>
              <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(payment.created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Payment Summary */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border-2 border-emerald-200 dark:border-emerald-800">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Betalningsöversikt</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">Totalt betalt:</span>
            <span className="text-xl font-bold text-green-600 dark:text-green-400">
              {amountPaid.toLocaleString('sv-SE')} {currency}
            </span>
          </div>
          {amountRemaining > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
              <span className="text-gray-600 dark:text-gray-400">Återstår att betala:</span>
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {amountRemaining.toLocaleString('sv-SE')} {currency}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

