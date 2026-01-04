// app/supplier-invoices/[id]/edit/page.tsx
'use client'

import React from 'react'
import { useParams, useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { InvoiceForm } from '@/components/supplier-invoices/InvoiceForm'
import { useSupplierInvoice, useUpdateSupplierInvoice } from '@/hooks/useSupplierInvoices'
import { ArrowLeft } from 'lucide-react'

export default function EditSupplierInvoicePage() {
 const params = useParams()
 const router = useRouter()
 const invoiceId = params.id as string

 const { data: invoice, isLoading } = useSupplierInvoice(invoiceId)
 const updateMutation = useUpdateSupplierInvoice(invoiceId)

 const handleSubmit = async (data: any) => {
  await updateMutation.mutateAsync(data)
  router.push(`/supplier-invoices/${invoiceId}`)
 }

 if (isLoading) {
  return (
   <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
    <Sidebar />
    <main className="flex-1 lg:ml-0">
     <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse space-y-4">
       <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
       <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
     </div>
    </main>
   </div>
  )
 }

 if (!invoice) {
  return (
   <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
    <Sidebar />
    <main className="flex-1 lg:ml-0">
     <div className="container mx-auto px-4 py-8">
      <p className="text-red-600">Faktura hittades inte</p>
     </div>
    </main>
   </div>
  )
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
       Redigera Faktura
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">{invoice.invoice_number}</p>
     </div>

     {/* Form */}
     <InvoiceForm invoice={invoice} onSubmit={handleSubmit} isLoading={updateMutation.isPending} />
    </div>
   </main>
  </div>
 )
}

