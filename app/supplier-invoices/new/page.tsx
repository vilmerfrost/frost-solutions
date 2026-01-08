// app/supplier-invoices/new/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { InvoiceForm } from '@/components/supplier-invoices/InvoiceForm'
import { InvoiceUpload } from '@/components/supplier-invoices/InvoiceUpload'
import { InvoiceOCRUpload } from '@/components/invoices/InvoiceOCRUpload'
import { ArrowLeft, FileText, Upload, Sparkles } from 'lucide-react'
import { useCreateSupplierInvoice } from '@/hooks/useSupplierInvoices'
import type { InvoiceOCRResult } from '@/lib/ai/frost-bygg-ai-integration'
import supabase from '@/utils/supabase/supabaseClient'
import { toast } from '@/lib/toast'

type TabType = 'manual' | 'upload' | 'ai-ocr'

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

 const handleAIOCRComplete = async (data: InvoiceOCRResult) => {
  try {
   const { data: invoice, error } = await supabase
    .from('supplier_invoices')
    .insert({
     supplier_name: data.supplierName,
     invoice_number: data.invoiceNumber,
     invoice_date: data.invoiceDate,
     due_date: data.dueDate || null,
     total_amount: data.totalAmount,
     vat_amount: data.vatAmount,
     subtotal: data.subtotal,
     vat_rate: data.vatRate,
     currency: data.currency,
     // Map line items if needed
    } as any)
    .select()
    .single()

   if (error) {
    toast.error('Kunde inte spara faktura: ' + error.message)
    return
   }

   const invoiceData = invoice as any
   toast.success('Faktura sparad!')
   if (invoiceData?.id) {
    router.push(`/supplier-invoices/${invoiceData.id}`)
   }
  } catch (error) {
   console.error('Error saving AI OCR invoice:', error)
   toast.error('Ett fel uppstod vid sparning')
  }
 }

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
       <ArrowLeft size={16} className="mr-2" />
       Tillbaka
      </Button>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
       Ny Leverantörsfaktura
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
       Skapa en faktura manuellt eller ladda upp för OCR-igenkänning
      </p>
     </div>

     {/* Tabs */}
     <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex gap-4 mb-6 flex-wrap">
       <button
        onClick={() => setActiveTab('manual')}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
         activeTab === 'manual'
          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
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
          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
       >
        <Upload size={20} />
        Upload & OCR
       </button>
       <button
        onClick={() => setActiveTab('ai-ocr')}
        className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
         activeTab === 'ai-ocr'
          ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
       >
        <Sparkles size={20} />
        AI OCR (Ny)
       </button>
      </div>

      {/* Content */}
      {activeTab === 'manual' ? (
       <InvoiceForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
      ) : activeTab === 'upload' ? (
       <InvoiceUpload onComplete={handleUploadComplete} />
      ) : (
       <div className="space-y-4">
        <div className="bg-primary-500 hover:bg-primary-600 dark:bg-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4 mb-4">
         <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-primary-500 dark:text-primary-400" />
          <h3 className="font-semibold text-purple-900 dark:text-purple-100">
           AI-powered fakturaavläsning
          </h3>
         </div>
         <p className="text-sm text-purple-800 dark:text-purple-200">
          Använd vår nya AI-teknologi för att automatiskt extrahera all information från fakturan. 
          Snabbare, mer exakt och helt automatiskt!
         </p>
        </div>
        <InvoiceOCRUpload
         onInvoiceExtracted={handleAIOCRComplete}
         onError={(error) => {
          toast.error(error)
         }}
        />
       </div>
      )}
     </div>
    </div>
   </main>
  </div>
 )
}

