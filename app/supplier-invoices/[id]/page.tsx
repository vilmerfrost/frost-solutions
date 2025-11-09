// app/supplier-invoices/[id]/page.tsx
'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { InvoiceDetail } from '@/components/supplier-invoices/InvoiceDetail'
import { useSupplierInvoice } from '@/hooks/useSupplierInvoices'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function SupplierInvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string

  const { data: invoice, isLoading, error } = useSupplierInvoice(invoiceId)

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                  <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Faktura hittades inte
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error?.message || 'Fakturan kunde inte laddas'}
              </p>
              <Button onClick={() => router.push('/supplier-invoices')}>
                <ArrowLeft size={16} className="mr-2" />
                Tillbaka till listan
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          <InvoiceDetail invoice={invoice} />
        </div>
      </main>
    </div>
  )
}

