// app/supplier-invoices/new/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { InvoiceForm } from '@/components/supplier-invoices/InvoiceForm'
import { InvoiceUpload } from '@/components/supplier-invoices/InvoiceUpload'
import { ArrowLeft, FileText, Upload } from 'lucide-react'
import { useCreateSupplierInvoice } from '@/hooks/useSupplierInvoices'

type TabType = 'manual' | 'upload'

export default function NewSupplierInvoicePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('manual')

  const createMutation = useCreateSupplierInvoice()

  const handleSubmit = async (data: any) => {
    const result = await createMutation.mutateAsync(data)
    if (result.success && result.data?.id) {
      router.push(`/supplier-invoices/${result.data.id}`)
    }
  }

  const handleUploadComplete = async (data: { invoiceId: string }) => {
    router.push(`/supplier-invoices/${data.invoiceId}`)
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Tillbaka
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
              Ny Leverantörsfaktura
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Skapa en faktura manuellt eller ladda upp för OCR-igenkänning
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setActiveTab('manual')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'manual'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FileText size={20} />
                Manuell Inmatning
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  activeTab === 'upload'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Upload size={20} />
                Upload & OCR
              </button>
            </div>

            {/* Content */}
            {activeTab === 'manual' ? (
              <InvoiceForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
            ) : (
              <InvoiceUpload onComplete={handleUploadComplete} />
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

