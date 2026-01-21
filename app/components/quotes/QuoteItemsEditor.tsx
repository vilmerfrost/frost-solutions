// app/components/quotes/QuoteItemsEditor.tsx
'use client'

import React, { useState } from 'react'
import { useQuoteItems, useCreateQuoteItem, useUpdateQuoteItem, useDeleteQuoteItem } from '@/hooks/useQuoteItems'
import { useQuote } from '@/hooks/useQuotes'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Edit, Trash2, Save, X, ShoppingCart, Package } from 'lucide-react'
import { MaterialPicker } from './MaterialPicker'
import type { QuoteItem } from '@/types/quotes'

interface QuoteItemsEditorProps {
 quoteId: string
}

export function QuoteItemsEditor({ quoteId }: QuoteItemsEditorProps) {
 const { data: items, isLoading } = useQuoteItems(quoteId)
 const { data: quote } = useQuote(quoteId)
 const createMutation = useCreateQuoteItem(quoteId)
 const updateMutation = useUpdateQuoteItem(quoteId)
 const deleteMutation = useDeleteQuoteItem(quoteId)

 const [editingId, setEditingId] = useState<string | null>(null)
 const [showAddForm, setShowAddForm] = useState(false)
 const [showMaterialPicker, setShowMaterialPicker] = useState(false)

 const [formData, setFormData] = useState({
  name: '',
  description: '',
  quantity: 1,
  unit: 'st',
  unit_price: 0,
  discount: 0,
  vat_rate: 25,
  item_type: 'material' as 'material' | 'labor' | 'other'
 })

 const resetForm = () => {
  setFormData({
   name: '',
   description: '',
   quantity: 1,
   unit: 'st',
   unit_price: 0,
   discount: 0,
   vat_rate: 25,
   item_type: 'material'
  })
 }

 const handleAdd = async () => {
  if (!formData.name.trim()) return

  await createMutation.mutateAsync({
   ...formData,
   quote_id: quoteId,
   order_index: (items?.length || 0) + 1
  })

  resetForm()
  setShowAddForm(false)
 }

 const handleEdit = (item: QuoteItem) => {
  setEditingId(item.id)
  setFormData({
   name: item.name,
   description: item.description || '',
   quantity: item.quantity,
   unit: item.unit,
   unit_price: item.unit_price,
   discount: item.discount,
   vat_rate: item.vat_rate,
   item_type: item.item_type
  })
 }

 const handleUpdate = async (itemId: string) => {
  await updateMutation.mutateAsync({
   itemId,
   data: formData
  })

  setEditingId(null)
  resetForm()
 }

 const handleDelete = async (itemId: string) => {
  if (confirm('Är du säker på att du vill radera denna artikel?')) {
   await deleteMutation.mutateAsync(itemId)
  }
 }

 const handleMaterialSelect = (material: any) => {
  setFormData((prev) => ({
   ...prev,
   name: material.name,
   description: material.description || '',
   unit: material.unit,
   unit_price: material.price
  }))
  setShowMaterialPicker(false)
  setShowAddForm(true)
 }

 if (isLoading) {
  return (
   <div className="bg-gray-50 dark:bg-gray-900 rounded-lg shadow p-6">
    <div className="animate-pulse space-y-4">
     <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
     <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
    </div>
   </div>
  )
 }

 const hasItems = items && items.length > 0

 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl border border-gray-200 dark:border-gray-700 p-6 backdrop-blur-sm bg-opacity-95">
   <div className="flex items-center justify-between mb-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
     Artiklar
    </h2>
    <div className="flex gap-2">
     <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => setShowMaterialPicker(!showMaterialPicker)}
      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
     >
      <Package size={16} className="mr-2" />
      Materialdatabas
     </Button>
     <Button
      type="button"
      size="sm"
      onClick={() => {
       setShowAddForm(!showAddForm)
       resetForm()
      }}
      className="bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md hover:shadow-xl transition-all duration-200"
     >
      <Plus size={16} className="mr-2" />
      Lägg till artikel
     </Button>
    </div>
   </div>

   {/* Material Picker */}
   {showMaterialPicker && (
    <div className="mb-6">
     <MaterialPicker 
      onSelect={handleMaterialSelect}
      onClose={() => setShowMaterialPicker(false)}
     />
    </div>
   )}

   {/* Add Form */}
   {showAddForm && (
    <div className="mb-6 p-4 border-2 border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm">
     <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3 flex items-center">
      <Plus size={18} className="mr-2" />
      Ny artikel
     </h3>
     <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Input
       placeholder="Namn *"
       value={formData.name}
       onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Input
       placeholder="Enhet"
       value={formData.unit}
       onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
      />
      <Input
       type="number"
       placeholder="Antal"
       value={formData.quantity}
       onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
      />
      <Input
       type="number"
       step="0.01"
       placeholder="Pris/enhet"
       value={formData.unit_price}
       onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
      />
      <Input
       type="number"
       placeholder="Rabatt %"
       value={formData.discount}
       onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
      />
      <Input
       type="number"
       placeholder="Moms %"
       value={formData.vat_rate}
       onChange={(e) => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
      />
      <select
       value={formData.item_type}
       onChange={(e) => setFormData({ ...formData, item_type: e.target.value as any })}
       className="px-3 py-2 border border-gray-300 rounded-md"
      >
       <option value="material">Material</option>
       <option value="labor">Arbete</option>
       <option value="other">Övrigt</option>
      </select>
     </div>
     <div className="mt-3">
      <Input
       placeholder="Beskrivning (valfritt)"
       value={formData.description}
       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
      />
     </div>
     <div className="flex gap-2 mt-3">
      <Button type="button" size="sm" onClick={handleAdd} disabled={createMutation.isPending}>
       <Save size={16} className="mr-2" />
       {createMutation.isPending ? 'Sparar...' : 'Spara'}
      </Button>
      <Button
       type="button"
       variant="secondary"
       size="sm"
       onClick={() => {
        setShowAddForm(false)
        resetForm()
       }}
      >
       <X size={16} className="mr-2" />
       Avbryt
      </Button>
     </div>
    </div>
   )}

   {/* Empty State - Visas endast när inga artiklar finns och formuläret inte är öppet */}
   {!hasItems && !showAddForm && (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
     <div className="flex justify-center mb-4">
      <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full">
       <ShoppingCart size={48} className="text-blue-600 dark:text-blue-400" />
      </div>
     </div>
     <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
      Inga artiklar ännu
     </h3>
     <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
      Lägg till artiklar för att bygga upp din offert. Du kan lägga till manuellt eller välja från materialdatabasen.
     </p>
     <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button
       type="button"
       size="lg"
       onClick={() => {
        setShowAddForm(true)
        resetForm()
       }}
       className="bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md hover:shadow-xl transition-all duration-200"
      >
       <Plus size={20} className="mr-2" />
       Lägg till artikel
      </Button>
      <Button
       type="button"
       variant="secondary"
       size="lg"
       onClick={() => setShowMaterialPicker(true)}
       className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
       <Package size={20} className="mr-2" />
       Välj från materialdatabas
      </Button>
     </div>
    </div>
   )}

   {/* Items Table */}
   {hasItems && (
    <Table>
     <TableHeader>
      <TableRow>
       <TableHead>Namn</TableHead>
       <TableHead>Antal</TableHead>
       <TableHead>Enhet</TableHead>
       <TableHead>Pris/enhet</TableHead>
       <TableHead>Rabatt</TableHead>
       <TableHead>Moms</TableHead>
       <TableHead className="text-right">Total</TableHead>
       <TableHead className="text-right">Åtgärder</TableHead>
      </TableRow>
     </TableHeader>
     <TableBody>
      {items.map((item) => (
       <TableRow key={item.id}>
        {editingId === item.id ? (
         <>
          <TableCell>
           <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
           />
          </TableCell>
          <TableCell>
           <Input
            type="number"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
           />
          </TableCell>
          <TableCell>
           <Input
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
           />
          </TableCell>
          <TableCell>
           <Input
            type="number"
            step="0.01"
            value={formData.unit_price}
            onChange={(e) => setFormData({ ...formData, unit_price: Number(e.target.value) })}
           />
          </TableCell>
          <TableCell>
           <Input
            type="number"
            value={formData.discount}
            onChange={(e) => setFormData({ ...formData, discount: Number(e.target.value) })}
           />
          </TableCell>
          <TableCell>
           <Input
            type="number"
            value={formData.vat_rate}
            onChange={(e) => setFormData({ ...formData, vat_rate: Number(e.target.value) })}
           />
          </TableCell>
          <TableCell className="text-right">-</TableCell>
          <TableCell className="text-right">
           <div className="flex gap-1 justify-end">
            <button
             type="button"
             onClick={() => handleUpdate(item.id)}
             className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
             disabled={updateMutation.isPending}
            >
             <Save size={16} />
            </button>
            <button
             type="button"
             onClick={() => {
              setEditingId(null)
              resetForm()
             }}
             className="p-1 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
             <X size={16} />
            </button>
           </div>
          </TableCell>
         </>
        ) : (
         <>
          <TableCell>
           <div>
            <div className="font-medium">{item.name}</div>
            {item.description && (
             <div className="text-sm text-gray-500">{item.description}</div>
            )}
           </div>
          </TableCell>
          <TableCell>{item.quantity}</TableCell>
          <TableCell>{item.unit}</TableCell>
          <TableCell>{item.unit_price.toLocaleString('sv-SE')} kr</TableCell>
          <TableCell>{item.discount}%</TableCell>
          <TableCell>{item.vat_rate}%</TableCell>
          <TableCell className="text-right font-medium">
           {item.line_total?.toLocaleString('sv-SE') || '0'} kr
          </TableCell>
          <TableCell className="text-right">
           <div className="flex gap-1 justify-end">
            <button
             type="button"
             onClick={() => handleEdit(item)}
             className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            >
             <Edit size={16} />
            </button>
            <button
             type="button"
             onClick={() => handleDelete(item.id)}
             className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
             disabled={deleteMutation.isPending}
            >
             <Trash2 size={16} />
            </button>
           </div>
          </TableCell>
         </>
        )}
       </TableRow>
      ))}
     </TableBody>
    </Table>
   )}

   {/* Totals Display */}
   {quote && items && items.length > 0 && (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
     <div className="flex flex-col items-end space-y-2 bg-primary-500 hover:bg-primary-600 dark:to-transparent p-4 rounded-lg">
      <div className="flex justify-between w-64">
       <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
       <span className="font-medium">{quote.subtotal.toLocaleString('sv-SE')} {quote.currency}</span>
      </div>
      <div className="flex justify-between w-64">
       <span className="text-gray-600 dark:text-gray-400">Rabatt:</span>
       <span className="font-medium text-red-600 dark:text-red-400">-{quote.discount_amount.toLocaleString('sv-SE')} {quote.currency}</span>
      </div>
      <div className="flex justify-between w-64">
       <span className="text-gray-600 dark:text-gray-400">Moms:</span>
       <span className="font-medium">{quote.tax_amount.toLocaleString('sv-SE')} {quote.currency}</span>
      </div>
      <div className="flex justify-between w-64 text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2 mt-2 text-gray-900 dark:text-white">
       <span>Total:</span>
       <span className="text-gray-900 dark:text-white">
        {quote.total_amount.toLocaleString('sv-SE')} {quote.currency}
       </span>
      </div>
     </div>
    </div>
   )}
  </div>
 )
}

