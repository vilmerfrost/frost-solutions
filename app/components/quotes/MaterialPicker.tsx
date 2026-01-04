// app/components/quotes/MaterialPicker.tsx
'use client'

import React, { useState } from 'react'
import { useMaterials } from '@/hooks/useMaterials'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Package, X } from 'lucide-react'

interface MaterialPickerProps {
 onSelect: (material: any) => void
 onClose?: () => void
}

export function MaterialPicker({ onSelect, onClose }: MaterialPickerProps) {
 const [search, setSearch] = useState('')
 const { data: materials, isLoading } = useMaterials(search)

 return (
  <div className="space-y-4 bg-gray-50 dark:bg-gray-900 dark:/20 dark: dark:/20 rounded-[8px] border-2 border-blue-200 dark:border-blue-700 p-6 shadow-md">
   <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
     <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
      <Package size={20} className="text-blue-600 dark:text-blue-400" />
     </div>
     <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
       Välj från materialdatabas
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
       Sök och välj material från din databas
      </p>
     </div>
    </div>
    {onClose && (
     <Button
      variant="ghost"
      size="sm"
      onClick={onClose}
      className="hover:bg-gray-100 dark:hover:bg-gray-700"
     >
      <X size={18} />
     </Button>
    )}
   </div>

   <div className="flex gap-2">
    <div className="flex-1 relative">
     <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
     <Input
      placeholder="Sök material..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="pl-10"
     />
    </div>
   </div>

   {isLoading && (
    <div className="text-center py-8">
     <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
     <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Laddar material...</p>
    </div>
   )}

   {materials && materials.length > 0 && (
    <div className="max-h-96 overflow-y-auto border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 shadow-inner">
     {materials.map((material) => (
      <div
       key={material.id}
       className="flex items-center justify-between p-4 hover:hover: hover: dark:hover:/20 dark:hover:/20 border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-colors cursor-pointer"
       onClick={() => onSelect(material)}
      >
       <div className="flex-1">
        <div className="font-semibold text-gray-900 dark:text-white">{material.name}</div>
        <div className="flex items-center gap-3 mt-1">
         {material.sku && (
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
           SKU: {material.sku}
          </span>
         )}
         {material.category && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
           {material.category}
          </span>
         )}
        </div>
       </div>
       <div className="flex items-center gap-4">
        <div className="text-right">
         <div className="font-bold text-emerald-600 dark:text-emerald-400">
          {material.price.toLocaleString('sv-SE')} kr
         </div>
         <div className="text-xs text-gray-500 dark:text-gray-400">per {material.unit}</div>
        </div>
        <Button 
         size="sm" 
         onClick={(e) => {
          e.stopPropagation()
          onSelect(material)
         }}
         className="bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md"
        >
         Välj
        </Button>
       </div>
      </div>
     ))}
    </div>
   )}

   {materials && materials.length === 0 && !isLoading && (
    <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900/50">
     <Package size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-3" />
     <p className="text-gray-600 dark:text-gray-400 font-medium">Inga material hittades</p>
     <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
      {search ? 'Prova en annan sökterm' : 'Lägg till material i databasen först'}
     </p>
    </div>
   )}
  </div>
 )
}

