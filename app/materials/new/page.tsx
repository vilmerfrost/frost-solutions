// app/materials/new/page.tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateMaterial } from '@/hooks/useMaterials'
import { ArrowLeft, Save } from 'lucide-react'

export default function NewMaterialPage() {
 const router = useRouter()
 const createMutation = useCreateMaterial()

 const [formData, setFormData] = useState({
  sku: '',
  name: '',
  category: '',
  unit: 'st',
  price: 0,
 })

 const [errors, setErrors] = useState<Record<string, string>>({})

 const validate = () => {
  const newErrors: Record<string, string> = {}

  if (!formData.name.trim()) {
   newErrors.name = 'Namn är obligatoriskt'
  }
  if (!formData.unit.trim()) {
   newErrors.unit = 'Enhet är obligatorisk'
  }
  if (formData.price < 0) {
   newErrors.price = 'Pris kan inte vara negativt'
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validate()) return

  const result = await createMutation.mutateAsync(formData)
  if (result.success) {
   router.push('/materials')
  }
 }

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0">
    <div className="container mx-auto px-4 py-8">
     {/* Header */}
     <div className="mb-8">
      <Button
       variant="ghost"
       onClick={() => router.back()}
       className="mb-4"
      >
       <ArrowLeft size={16} className="mr-2" />
       Tillbaka
      </Button>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
       Nytt Material
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-2">
       Lägg till ett nytt material i databasen
      </p>
     </div>

     {/* Form */}
     <form onSubmit={handleSubmit} className="max-w-2xl">
      <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6 backdrop-blur-sm">
       <div className="space-y-6">
        <Input
         label="SKU (valfritt)"
         placeholder="T.ex. TAK-001"
         value={formData.sku}
         onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
        />

        <Input
         label="Namn *"
         placeholder="T.ex. Takpannor röda"
         value={formData.name}
         onChange={(e) => {
          setFormData({ ...formData, name: e.target.value })
          if (errors.name) setErrors({ ...errors, name: '' })
         }}
         error={errors.name}
        />

        <Input
         label="Kategori (valfritt)"
         placeholder="T.ex. Takarbete"
         value={formData.category}
         onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
         <Input
          label="Enhet *"
          placeholder="T.ex. st, m², kg"
          value={formData.unit}
          onChange={(e) => {
           setFormData({ ...formData, unit: e.target.value })
           if (errors.unit) setErrors({ ...errors, unit: '' })
          }}
          error={errors.unit}
         />

         <Input
          label="Pris (kr) *"
          type="number"
          step="0.01"
          min="0"
          value={formData.price}
          onChange={(e) => {
           setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
           if (errors.price) setErrors({ ...errors, price: '' })
          }}
          error={errors.price}
         />
        </div>
       </div>

       {/* Actions */}
       <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
         type="button"
         variant="secondary"
         onClick={() => router.back()}
         disabled={createMutation.isPending}
        >
         Avbryt
        </Button>
        <Button 
         type="submit" 
         disabled={createMutation.isPending}
         className="bg-success-600 hover:bg-success-700"
        >
         <Save size={16} className="mr-2" />
         {createMutation.isPending ? 'Sparar...' : 'Spara Material'}
        </Button>
       </div>
      </div>
     </form>
    </div>
   </main>
  </div>
 )
}

