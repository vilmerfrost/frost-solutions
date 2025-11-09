// app/components/supplier-invoices/InvoiceDetail.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { InvoiceItemsTable } from './InvoiceItemsTable'
import { InvoicePaymentsList } from './InvoicePaymentsList'
import { InvoiceHistoryTimeline } from './InvoiceHistoryTimeline'
import { PaymentForm } from './PaymentForm'
import {
  ArrowLeft,
  Edit,
  CheckCircle,
  Archive,
  Download,
  FileText,
  DollarSign,
  Calendar,
  Building2,
  FolderOpen
} from 'lucide-react'
import {
  useApproveSupplierInvoice,
  useConvertToCustomerInvoice,
  useSupplierInvoiceHistory
} from '@/hooks/useSupplierInvoices'
import { getSupplierInvoiceUrl } from '@/lib/storage/getSupplierInvoiceUrl'
import type { SupplierInvoice, SupplierInvoiceStatus } from '@/types/supplierInvoices'

interface InvoiceDetailProps {
  invoice: SupplierInvoice
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

export function InvoiceDetail({ invoice }: InvoiceDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'info' | 'items' | 'payments' | 'history'>('info')
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  const approveMutation = useApproveSupplierInvoice()
  const convertMutation = useConvertToCustomerInvoice()
  const { data: history } = useSupplierInvoiceHistory(invoice.id)

  // Use history from hook if available, otherwise fallback to invoice.history
  const displayHistory = history || invoice.history || []

  const handleApprove = async () => {
    if (confirm('Godkänn denna faktura? Påslag kommer att beräknas automatiskt.')) {
      await approveMutation.mutateAsync(invoice.id)
    }
  }

  const handleConvert = async () => {
    if (confirm('Konvertera till kundfaktura? Detta skapar en ny faktura till kunden.')) {
      const result = await convertMutation.mutateAsync(invoice.id)
      if (result.success && result.data?.customerInvoiceId) {
        router.push(`/invoices/${result.data.customerInvoiceId}`)
      }
    }
  }

  const handleDownloadPDF = async () => {
    if (invoice.file_path) {
      try {
        const url = await getSupplierInvoiceUrl(invoice.file_path)
        window.open(url, '_blank')
      } catch (error) {
        console.error('Error getting PDF URL:', error)
        alert('Kunde inte ladda ner PDF')
      }
    }
  }

  const canApprove = invoice.status === 'pending_approval'
  const canConvert = invoice.status === 'approved' && !invoice.converted_to_customer_invoice
  const canRegisterPayment =
    ['approved', 'booked'].includes(invoice.status) && invoice.amount_paid < invoice.amount_total

  const billableAmount = invoice.amount_total + invoice.markup_total

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Tillbaka
          </Button>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              {invoice.invoice_number}
            </h1>
            <Badge variant={statusColors[invoice.status]} className="text-lg px-4 py-1">
              {invoice.status}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{invoice.supplier?.name}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {invoice.file_path && (
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download size={16} className="mr-2" />
              Ladda ner PDF
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} disabled={approveMutation.isPending}>
              <CheckCircle size={16} className="mr-2" />
              Godkänn
            </Button>
          )}
          {canConvert && (
            <Button
              onClick={handleConvert}
              disabled={convertMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <FileText size={16} className="mr-2" />
              Konvertera till Kundfaktura
            </Button>
          )}
          <Link href={`/supplier-invoices/${invoice.id}/edit`}>
            <Button variant="outline">
              <Edit size={16} className="mr-2" />
              Redigera
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
              activeTab === 'info'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Information
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
              activeTab === 'items'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Artiklar ({invoice.items?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
              activeTab === 'payments'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Betalningar ({invoice.payments?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-4 font-semibold transition-all duration-200 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Historik
          </button>
        </div>

        <div className="p-6">
          {/* Info Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Basic Info Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Building2 size={16} />
                      Leverantör
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {invoice.supplier?.name || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <FolderOpen size={16} />
                      Projekt
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {invoice.project?.name || '-'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Calendar size={16} />
                      Datum
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                      {formatDate(invoice.invoice_date)}
                    </p>
                  </div>

                  {invoice.due_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Förfallodatum
                      </label>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                        {formatDate(invoice.due_date)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Amounts Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border-2 border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Belopp</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount_subtotal, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Moms:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(invoice.amount_tax, invoice.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(invoice.amount_total, invoice.currency)}
                      </span>
                    </div>

                    {invoice.markup_total > 0 && (
                      <>
                        <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
                          <span className="text-gray-600 dark:text-gray-400">Påslag:</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            +{formatCurrency(invoice.markup_total, invoice.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t-2 border-emerald-300 dark:border-emerald-700">
                          <span className="font-bold text-gray-900 dark:text-white">
                            Fakturerbart belopp:
                          </span>
                          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(billableAmount, invoice.currency)}
                          </span>
                        </div>
                      </>
                    )}

                    {invoice.amount_paid > 0 && (
                      <div className="flex justify-between items-center pt-2 border-t border-emerald-200 dark:border-emerald-800">
                        <span className="text-gray-600 dark:text-gray-400">Betalt:</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(invoice.amount_paid, invoice.currency)}
                        </span>
                      </div>
                    )}

                    {invoice.amount_remaining > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Återstår:</span>
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {formatCurrency(invoice.amount_remaining, invoice.currency)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {invoice.notes && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                    Noteringar
                  </label>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}

              {/* OCR Confidence */}
              {invoice.ocr_confidence && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>OCR-igenkänning:</strong> {invoice.ocr_confidence}% säkerhet
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Items Tab */}
          {activeTab === 'items' && (
            <InvoiceItemsTable items={invoice.items || []} currency={invoice.currency} />
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {canRegisterPayment && (
                <div>
                  {!showPaymentForm ? (
                    <Button onClick={() => setShowPaymentForm(true)}>
                      <DollarSign size={16} className="mr-2" />
                      Registrera betalning
                    </Button>
                  ) : (
                    <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-lg border-2 border-gray-200 dark:border-gray-700 p-6">
                      <PaymentForm
                        invoiceId={invoice.id}
                        maxAmount={invoice.amount_remaining}
                        currency={invoice.currency}
                        onSuccess={() => setShowPaymentForm(false)}
                        onCancel={() => setShowPaymentForm(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              <InvoicePaymentsList
                payments={invoice.payments || []}
                currency={invoice.currency}
                amountPaid={invoice.amount_paid}
                amountRemaining={invoice.amount_remaining}
              />
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && <InvoiceHistoryTimeline history={displayHistory} />}
        </div>
      </div>
    </div>
  )
}

