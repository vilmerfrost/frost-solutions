// app/components/supplier-invoices/InvoiceForm.tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Input, Textarea } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useProjects } from '@/hooks/useProjects'
import { Plus, Trash2, Save } from 'lucide-react'
import type { SupplierInvoice, SupplierInvoiceItem } from '@/types/supplierInvoices'

interface InvoiceFormProps {
 invoice?: SupplierInvoice
 onSubmit: (data: any) => Promise<void>
 isLoading: boolean
}

export function InvoiceForm({ invoice, onSubmit, isLoading }: InvoiceFormProps) {
 const { data: suppliers } = useSuppliers()
 const { data: projects } = useProjects()
 const suppliersReady = Array.isArray(suppliers)
 const noSuppliers = suppliersReady && suppliers.length === 0

 const [formData, setFormData] = useState({
  supplier_id: invoice?.supplier_id || '',
  project_id: invoice?.project_id || '',
  invoice_number: invoice?.invoice_number || '',
  invoice_date: invoice?.invoice_date ? invoice.invoice_date.split('T')[0] : new Date().toISOString().split('T')[0],
  due_date: invoice?.due_date ? invoice.due_date.split('T')[0] : '',
  currency: invoice?.currency || 'SEK',
  notes: invoice?.notes || ''
 })

 const [items, setItems] = useState<Partial<SupplierInvoiceItem>[]>(
  invoice?.items && invoice.items.length > 0
   ? invoice.items
   : [
     {
      item_type: 'material',
      name: '',
      description: '',
      quantity: 1,
      unit: 'st',
      unit_price: 0,
      vat_rate: 25
     }
    ]
 )

 const [errors, setErrors] = useState<Record<string, string>>({})

 const addItem = () => {
  setItems([
   ...items,
   {
    item_type: 'material',
    name: '',
    description: '',
    quantity: 1,
    unit: 'st',
    unit_price: 0,
    vat_rate: 25
   }
  ])
 }

 const removeItem = (index: number) => {
  if (items.length > 1) {
   setItems(items.filter((_, i) => i !== index))
  }
 }

 const updateItem = (index: number, field: keyof SupplierInvoiceItem, value: any) => {
  const newItems = [...items]
  newItems[index] = { ...newItems[index], [field]: value }
  setItems(newItems)
 }

 const validate = () => {
  const newErrors: Record<string, string> = {}

  if (!formData.supplier_id) {
   newErrors.supplier_id = 'Leverantör är obligatorisk'
  }
  if (!formData.invoice_number) {
   newErrors.invoice_number = 'Fakturanummer är obligatoriskt'
  }
  if (!formData.invoice_date) {
   newErrors.invoice_date = 'Fakturadatum är obligatoriskt'
  }

  items.forEach((item, index) => {
   if (!item.name?.trim()) {
    newErrors[`item_${index}_name`] = 'Namn är obligatoriskt'
   }
  })

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validate()) {
   return
  }

  await onSubmit({
   ...formData,
   items: items.map((item, idx) => ({
    ...item,
    order_index: idx + 1
   }))
  })
 }

 // Beräkna totals
 const subtotal = items.reduce((sum, item) => {
  return sum + ((item.quantity || 0) * (item.unit_price || 0))
 }, 0)

 const totalVat = items.reduce((sum, item) => {
  const lineTotal = (item.quantity || 0) * (item.unit_price || 0)
  return sum + (lineTotal * (item.vat_rate || 0) / 100)
 }, 0)

 const total = subtotal + totalVat

 return (
  <form onSubmit={handleSubmit} className="space-y-6">
   {/* Basic Info */}
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
     Grundläggande Information
    </h2>

    {noSuppliers && (
     <div className="mb-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <span>
       Ingen registrerad leverantör ännu? Du behöver skapa en leverantör innan du kan spara fakturan.
      </span>
      <Link href="/suppliers/new">
       <Button size="sm" className="bg-primary-500 hover:bg-primary-600 hover: hover:">
        Skapa leverantör
       </Button>
      </Link>
     </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <Select
      label="Leverantör *"
      value={formData.supplier_id}
      onChange={(e) => {
       setFormData({ ...formData, supplier_id: e.target.value })
       if (errors.supplier_id) setErrors({ ...errors, supplier_id: '' })
      }}
      error={errors.supplier_id}
      disabled={!suppliersReady || noSuppliers}
     >
      {suppliersReady ? (
       <>
        <option value="">Välj leverantör</option>
        {suppliers?.map((supplier) => (
         <option key={supplier.id} value={supplier.id}>
          {supplier.name}
         </option>
        ))}
       </>
      ) : (
       <option value="">Inga leverantörer ännu</option>
      )}
     </Select>

     <Select
      label="Projekt (valfritt)"
      value={formData.project_id}
      onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
     >
      <option value="">Inget projekt</option>
      {projects?.map((project) => (
       <option key={project.id} value={project.id}>
        {project.name}
       </option>
      ))}
     </Select>

     <Input
      label="Fakturanummer *"
      value={formData.invoice_number}
      onChange={(e) => {
       setFormData({ ...formData, invoice_number: e.target.value })
       if (errors.invoice_number) setErrors({ ...errors, invoice_number: '' })
      }}
      error={errors.invoice_number}
      placeholder="T.ex. INV-2025-001"
     />

     <Input
      label="Fakturadatum *"
      type="date"
      value={formData.invoice_date}
      onChange={(e) => {
       setFormData({ ...formData, invoice_date: e.target.value })
       if (errors.invoice_date) setErrors({ ...errors, invoice_date: '' })
      }}
      error={errors.invoice_date}
     />

     <Input
      label="Förfallodatum"
      type="date"
      value={formData.due_date}
      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
     />

     <Select
      label="Valuta"
      value={formData.currency}
      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
     >
      <option value="SEK">SEK</option>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
     </Select>
    </div>

    <div className="mt-4">
     <Textarea
      label="Noteringar"
      value={formData.notes}
      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
      rows={3}
      placeholder="Interna anteckningar..."
     />
    </div>
   </div>

   {/* Items */}
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
    <div className="flex items-center justify-between mb-4">
     <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
      Artiklar
     </h2>
     <Button type="button" size="sm" onClick={addItem}>
      <Plus size={16} className="mr-2" />
      Lägg till artikel
     </Button>
    </div>

    <div className="space-y-4">
     {items.map((item, index) => (
      <div
       key={index}
       className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
      >
       <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <Select
         label="Typ"
         value={item.item_type || 'material'}
         onChange={(e) => updateItem(index, 'item_type', e.target.value)}
        >
         <option value="material">Material</option>
         <option value="labor">Arbetskostnad</option>
         <option value="transport">Transport</option>
         <option value="other">Övrigt</option>
        </Select>

        <div className="md:col-span-2">
         <Input
          label="Namn *"
          value={item.name || ''}
          onChange={(e) => updateItem(index, 'name', e.target.value)}
          error={errors[`item_${index}_name`]}
          placeholder="T.ex. Cement"
         />
        </div>

        <Input
         label="Antal"
         type="number"
         step="0.01"
         value={item.quantity || 1}
         onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
        />

        <Input
         label="Enhet"
         value={item.unit || 'st'}
         onChange={(e) => updateItem(index, 'unit', e.target.value)}
         placeholder="st, kg, m²"
        />

        <Input
         label="Pris/enhet"
         type="number"
         step="0.01"
         value={item.unit_price || 0}
         onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
        />
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        <div className="md:col-span-2">
         <Input
          label="Beskrivning"
          value={item.description || ''}
          onChange={(e) => updateItem(index, 'description', e.target.value)}
          placeholder="Valfri beskrivning..."
         />
        </div>

        <Input
         label="Moms %"
         type="number"
         step="0.01"
         value={item.vat_rate || 25}
         onChange={(e) => updateItem(index, 'vat_rate', parseFloat(e.target.value) || 0)}
        />
       </div>

       <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
        <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
         Radtotal:{' '}
         {((item.quantity || 0) * (item.unit_price || 0)).toLocaleString('sv-SE')}{' '}
         {formData.currency}
        </div>
        {items.length > 1 && (
         <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => removeItem(index)}
          className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
         >
          <Trash2 size={16} className="mr-2" />
          Ta bort
         </Button>
        )}
       </div>
      </div>
     ))}
    </div>

    {/* Totals */}
    <div className="mt-6 pt-4 border-t border-gray-300 dark:border-gray-600">
     <div className="flex flex-col items-end space-y-2">
      <div className="flex justify-between w-64">
       <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
       <span className="font-medium">{subtotal.toLocaleString('sv-SE')} {formData.currency}</span>
      </div>
      <div className="flex justify-between w-64">
       <span className="text-gray-600 dark:text-gray-400">Moms:</span>
       <span className="font-medium">{totalVat.toLocaleString('sv-SE')} {formData.currency}</span>
      </div>
      <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
       <span>Total:</span>
       <span className="text-emerald-600 dark:text-emerald-400">
        {total.toLocaleString('sv-SE')} {formData.currency}
       </span>
      </div>
     </div>
    </div>
   </div>

   {/* Submit */}
   <div className="flex items-center justify-end gap-3">
    <Button
     type="submit"
     disabled={isLoading || (suppliersReady && noSuppliers)}
     size="lg"
     className="bg-primary-500 hover:bg-primary-600 hover: hover:"
    >
     <Save size={16} className="mr-2" />
     {!suppliersReady
      ? 'Laddar leverantörer...'
      : noSuppliers
       ? 'Lägg till leverantör'
       : isLoading
        ? 'Sparar...'
        : invoice
         ? 'Uppdatera Faktura'
         : 'Skapa Faktura'}
    </Button>
   </div>
  </form>
 )
}

