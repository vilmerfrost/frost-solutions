'use client'

import React from 'react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Factory } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SupplierForm } from '@/components/suppliers/SupplierForm'

export default function NewSupplierPage() {
 const router = useRouter()

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     <div className="mb-8">
      <Button variant="ghost" onClick={() => router.back()} className="mb-4">
       <ArrowLeft size={16} className="mr-2" />
       Tillbaka
      </Button>
      <div className="flex items-center gap-4">
       <div className="p-3 bg-primary-500 hover:bg-primary-600 rounded-[8px] shadow-md">
        <Factory size={32} className="text-white" />
       </div>
       <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
         Ny Leverantör
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
         Lägg till leverantörer för att kunna registrera leverantörsfakturor
        </p>
       </div>
      </div>
     </div>

     <SupplierForm />
    </div>
   </main>
  </div>
 )
}


