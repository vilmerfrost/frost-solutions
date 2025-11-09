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
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Tillbaka
            </Button>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Factory size={32} className="text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
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


