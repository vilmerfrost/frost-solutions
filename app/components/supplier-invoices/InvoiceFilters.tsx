// app/components/supplier-invoices/InvoiceFilters.tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useProjects } from '@/hooks/useProjects'
import { X, Filter } from 'lucide-react'
import type { SupplierInvoiceFilters, SupplierInvoiceStatus } from '@/types/supplierInvoices'

interface InvoiceFiltersProps {
 filters: SupplierInvoiceFilters
 onFiltersChange: (filters: SupplierInvoiceFilters) => void
}

const statuses: SupplierInvoiceStatus[] = [
 'draft',
 'pending_approval',
 'approved',
 'booked',
 'paid',
 'rejected',
 'archived'
]

const statusLabels: Record<SupplierInvoiceStatus, string> = {
 draft: 'Utkast',
 pending_approval: 'Väntar godkännande',
 approved: 'Godkänd',
 booked: 'Bokförd',
 paid: 'Betald',
 rejected: 'Avvisad',
 archived: 'Arkiverad'
}

export function InvoiceFilters({ filters, onFiltersChange }: InvoiceFiltersProps) {
 const { data: suppliers } = useSuppliers()
 const { data: projects } = useProjects()
 const suppliersReady = Array.isArray(suppliers)
 const noSuppliers = suppliersReady && suppliers.length === 0

 const handleClear = () => {
  onFiltersChange({ page: 1, limit: 20 })
 }

 const hasFilters = filters.status || filters.supplierId || filters.projectId || filters.search

 return (
  <div className="bg-white dark:from-gray-800 dark:/50 dark:to-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 mb-6">
   <div className="flex items-center gap-3 mb-4">
    <Filter size={20} className="text-emerald-600 dark:text-emerald-400" />
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filtrera fakturor</h3>
   </div>

   <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    <Select
     label="Status"
     value={filters.status || ''}
     onChange={(e) =>
      onFiltersChange({ ...filters, status: e.target.value as SupplierInvoiceStatus, page: 1 })
     }
    >
     <option value="">Alla statusar</option>
     {statuses.map((status) => (
      <option key={status} value={status}>
       {statusLabels[status]}
      </option>
     ))}
    </Select>

    <Select
     label="Leverantör"
     value={filters.supplierId || ''}
     onChange={(e) => onFiltersChange({ ...filters, supplierId: e.target.value, page: 1 })}
     disabled={!suppliersReady || noSuppliers}
    >
     {!suppliersReady ? (
      <option value="">Laddar leverantörer...</option>
     ) : noSuppliers ? (
      <option value="">Inga leverantörer ännu</option>
     ) : (
      <>
       <option value="">Alla leverantörer</option>
       {suppliers?.map((supplier) => (
        <option key={supplier.id} value={supplier.id}>
         {supplier.name}
        </option>
       ))}
      </>
     )}
    </Select>

    <Select
     label="Projekt"
     value={filters.projectId || ''}
     onChange={(e) => onFiltersChange({ ...filters, projectId: e.target.value, page: 1 })}
    >
     <option value="">Alla projekt</option>
     {projects?.map((project) => (
      <option key={project.id} value={project.id}>
       {project.name}
      </option>
     ))}
    </Select>

    <Input
     label="Sök"
     type="search"
     placeholder="Fakturanummer, noteringar..."
     value={filters.search || ''}
     onChange={(e) => onFiltersChange({ ...filters, search: e.target.value, page: 1 })}
    />
   </div>

   {hasFilters && (
    <div className="mt-4 flex justify-end">
     <Button variant="ghost" onClick={handleClear} size="sm">
      <X size={16} className="mr-2" />
      Rensa filter
     </Button>
    </div>
   )}

   {suppliersReady && noSuppliers && (
    <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">
     Tips: Lägg till din första leverantör via sidan{' '}
     <Link href="/suppliers/new" className="underline font-medium">
      Ny leverantör
     </Link>{' '}
     för att kunna filtrera och skapa fakturor.
    </p>
   )}
  </div>
 )
}

