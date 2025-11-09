// app/supplier-invoices/page.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { InvoiceList } from '@/components/supplier-invoices/InvoiceList'
import { InvoiceFilters } from '@/components/supplier-invoices/InvoiceFilters'
import { Plus, FileText } from 'lucide-react'
import type { SupplierInvoiceFilters } from '@/hooks/useSupplierInvoices'
import { useSuppliers } from '@/hooks/useSuppliers'

export default function SupplierInvoicesPage() {
  const [filters, setFilters] = useState<SupplierInvoiceFilters>({
    page: 1,
    limit: 20
  })
  const { data: suppliers } = useSuppliers()
  const suppliersReady = Array.isArray(suppliers)
  const showNoSuppliersCallout = suppliersReady && suppliers.length === 0

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <FileText size={32} className="text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent">
                    Leverantörsfakturor
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Hantera inkommande fakturor och påslag
                  </p>
                </div>
              </div>
              <Link href="/supplier-invoices/new">
                <Button
                  size="lg"
                  className="shadow-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus size={20} className="mr-2" />
                  Ny Faktura
                </Button>
              </Link>
            </div>
          </div>

          {showNoSuppliersCallout && (
            <div className="mb-6 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <span>
                Du har ännu inga leverantörer registrerade. Skapa en leverantör för att komma igång med leverantörsfakturor.
              </span>
              <Link href="/suppliers/new">
                <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  Lägg till leverantör
                </Button>
              </Link>
            </div>
          )}

          {/* Filters */}
          <InvoiceFilters filters={filters} onFiltersChange={setFilters} />

          {/* Invoice List */}
          <InvoiceList filters={filters} onPageChange={(page) => setFilters({ ...filters, page })} />
        </div>
      </main>
    </div>
  )
}

