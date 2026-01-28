// app/materials/new/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCreateMaterial } from '@/hooks/useMaterials'
import { useTenant } from '@/context/TenantContext'
import { BASE_PATH } from '@/utils/url'
import supabase from '@/utils/supabase/supabaseClient'
import { 
 ArrowLeft, 
 Save, 
 Package, 
 DollarSign, 
 Boxes, 
 Truck,
 Leaf,
 AlertTriangle
} from 'lucide-react'

type CategoryType = 'CONSTRUCTION' | 'PLUMBING' | 'ELECTRICAL' | 'FLOORING' | 'ROOFING' | 'PAINTING' | 'TOOLS' | 'SAFETY' | 'OTHER'
type UnitType = 'st' | 'm' | 'm2' | 'm3' | 'kg' | 'L' | 'pack' | 'roll'

const CATEGORIES: { value: CategoryType; label: string }[] = [
 { value: 'CONSTRUCTION', label: 'Byggmaterial' },
 { value: 'PLUMBING', label: 'VVS' },
 { value: 'ELECTRICAL', label: 'El' },
 { value: 'FLOORING', label: 'Golv' },
 { value: 'ROOFING', label: 'Tak' },
 { value: 'PAINTING', label: 'Målning' },
 { value: 'TOOLS', label: 'Verktyg' },
 { value: 'SAFETY', label: 'Skyddsutrustning' },
 { value: 'OTHER', label: 'Övrigt' },
]

const UNITS: { value: UnitType; label: string }[] = [
 { value: 'st', label: 'Styck (st)' },
 { value: 'm', label: 'Meter (m)' },
 { value: 'm2', label: 'Kvadratmeter (m²)' },
 { value: 'm3', label: 'Kubikmeter (m³)' },
 { value: 'kg', label: 'Kilogram (kg)' },
 { value: 'L', label: 'Liter (L)' },
 { value: 'pack', label: 'Förpackning' },
 { value: 'roll', label: 'Rulle' },
]

interface Supplier {
 id: string
 name: string
}

export default function NewMaterialPage() {
 const router = useRouter()
 const createMutation = useCreateMaterial()
 const { tenantId } = useTenant()

 const [suppliers, setSuppliers] = useState<Supplier[]>([])
 const [errors, setErrors] = useState<Record<string, string>>({})

 // Basic info
 const [sku, setSku] = useState('')
 const [name, setName] = useState('')
 const [category, setCategory] = useState<CategoryType | ''>('')
 const [unit, setUnit] = useState<UnitType>('st')
 const [packageQuantity, setPackageQuantity] = useState('')

 // Pricing
 const [purchasePrice, setPurchasePrice] = useState('')
 const [salePrice, setSalePrice] = useState('')

 // Stock
 const [stockQuantity, setStockQuantity] = useState('')
 const [minStockLevel, setMinStockLevel] = useState('')

 // Supplier
 const [supplierId, setSupplierId] = useState('')
 const [supplierArticleNumber, setSupplierArticleNumber] = useState('')
 const [supplierUrl, setSupplierUrl] = useState('')

 // Environment
 const [isEcoCertified, setIsEcoCertified] = useState(false)
 const [isRecyclable, setIsRecyclable] = useState(false)
 const [isHazardous, setIsHazardous] = useState(false)

 // Notes
 const [notes, setNotes] = useState('')

 // Calculate margin
 const margin = purchasePrice && salePrice 
  ? ((Number(salePrice) - Number(purchasePrice)) / Number(purchasePrice) * 100).toFixed(1)
  : null

 // Fetch suppliers
 useEffect(() => {
  async function fetchSuppliers() {
   if (!tenantId) return
   
   const { data } = await supabase
    .from('suppliers')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name')
   
   if (data) {
    setSuppliers(data)
   }
  }
  fetchSuppliers()
 }, [tenantId])

 const validate = () => {
  const newErrors: Record<string, string> = {}

  if (!name.trim()) {
   newErrors.name = 'Materialnamn är obligatoriskt'
  }
  if (!category) {
   newErrors.category = 'Kategori är obligatorisk'
  }
  if (!unit) {
   newErrors.unit = 'Enhet är obligatorisk'
  }
  if (!purchasePrice || Number(purchasePrice) <= 0) {
   newErrors.purchasePrice = 'Inköpspris är obligatoriskt'
  }
  if (!salePrice || Number(salePrice) <= 0) {
   newErrors.salePrice = 'Försäljningspris är obligatoriskt'
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validate()) return

  const formData: any = {
   sku: sku.trim() || null,
   name: name.trim(),
   category: category || null,
   category_type: category || null,
   unit,
   price: Number(salePrice) || 0, // Legacy field
   package_quantity: packageQuantity ? Number(packageQuantity) : 1,
   purchase_price: purchasePrice ? Number(purchasePrice) : null,
   sale_price: salePrice ? Number(salePrice) : null,
   stock_quantity: stockQuantity ? Number(stockQuantity) : 0,
   min_stock_level: minStockLevel ? Number(minStockLevel) : 0,
   supplier_id: supplierId || null,
   supplier_article_number: supplierArticleNumber.trim() || null,
   supplier_url: supplierUrl.trim() || null,
   is_eco_certified: isEcoCertified,
   is_recyclable: isRecyclable,
   is_hazardous: isHazardous,
   notes: notes.trim() || null,
  }

  const result = await createMutation.mutateAsync(formData)
  if (result.success) {
   router.push(`${BASE_PATH}/materials`)
  }
 }

 return (
  <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
   <Sidebar />
   <main className="flex-1 lg:ml-0 overflow-x-hidden">
    <div className="container mx-auto px-4 py-8 max-w-3xl">
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
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
       Nytt Material
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mt-1">
       Lägg till ett nytt material i lagret
      </p>
     </div>

     <form onSubmit={handleSubmit} className="space-y-6">
      {/* GRUNDLÄGGANDE INFO */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Package className="w-5 h-5 text-primary-500" />
        Grundläggande info
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
         label="Artikelnummer (SKU)"
         placeholder="T.ex. TAK-001"
         value={sku}
         onChange={(e) => setSku(e.target.value)}
        />

        <Input
         label="Materialnamn *"
         placeholder="T.ex. Takpannor röda"
         value={name}
         onChange={(e) => {
          setName(e.target.value)
          if (errors.name) setErrors({ ...errors, name: '' })
         }}
         error={errors.name}
        />
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kategori *
         </label>
         <select
          value={category}
          onChange={(e) => {
           setCategory(e.target.value as CategoryType)
           if (errors.category) setErrors({ ...errors, category: '' })
          }}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         >
          <option value="">Välj kategori...</option>
          {CATEGORIES.map((cat) => (
           <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
         </select>
         {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Enhet *
         </label>
         <select
          value={unit}
          onChange={(e) => {
           setUnit(e.target.value as UnitType)
           if (errors.unit) setErrors({ ...errors, unit: '' })
          }}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         >
          {UNITS.map((u) => (
           <option key={u.value} value={u.value}>{u.label}</option>
          ))}
         </select>
        </div>

        <Input
         label="Mängd per förpackning"
         type="number"
         placeholder="1"
         value={packageQuantity}
         onChange={(e) => setPackageQuantity(e.target.value)}
        />
       </div>
      </div>

      {/* PRISSÄTTNING */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-primary-500" />
        Prissättning
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Inköpspris (kr) *
         </label>
         <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={purchasePrice}
          onChange={(e) => {
           setPurchasePrice(e.target.value)
           if (errors.purchasePrice) setErrors({ ...errors, purchasePrice: '' })
          }}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         />
         {errors.purchasePrice && <p className="text-red-500 text-sm mt-1">{errors.purchasePrice}</p>}
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Försäljningspris (kr) *
         </label>
         <input
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={salePrice}
          onChange={(e) => {
           setSalePrice(e.target.value)
           if (errors.salePrice) setErrors({ ...errors, salePrice: '' })
          }}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         />
         {errors.salePrice && <p className="text-red-500 text-sm mt-1">{errors.salePrice}</p>}
        </div>

        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Marginal
         </label>
         <div className={`px-4 py-2.5 rounded-lg border ${
          margin && Number(margin) > 0 
           ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300'
           : 'bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'
         } font-medium`}>
          {margin ? `${margin}%` : '—'}
         </div>
        </div>
       </div>
      </div>

      {/* LAGERSTATUS */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Boxes className="w-5 h-5 text-primary-500" />
        Lagerstatus
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
         label="Lagersaldo"
         type="number"
         min="0"
         placeholder="0"
         value={stockQuantity}
         onChange={(e) => setStockQuantity(e.target.value)}
        />

        <Input
         label="Min. lagernivå för påminnelse"
         type="number"
         min="0"
         placeholder="0"
         value={minStockLevel}
         onChange={(e) => setMinStockLevel(e.target.value)}
        />
       </div>
      </div>

      {/* LEVERANTÖR */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Truck className="w-5 h-5 text-primary-500" />
        Leverantör
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Leverantör
         </label>
         <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         >
          <option value="">Välj leverantör...</option>
          {suppliers.map((s) => (
           <option key={s.id} value={s.id}>{s.name}</option>
          ))}
         </select>
         {suppliers.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
           Inga leverantörer. Du kan lägga till dem i inställningarna.
          </p>
         )}
        </div>

        <Input
         label="Leverantörens artikelnummer"
         placeholder="T.ex. LM-12345"
         value={supplierArticleNumber}
         onChange={(e) => setSupplierArticleNumber(e.target.value)}
        />
       </div>

       <div className="mt-4">
        <Input
         label="Webbadress till produkt"
         type="url"
         placeholder="https://..."
         value={supplierUrl}
         onChange={(e) => setSupplierUrl(e.target.value)}
        />
       </div>
      </div>

      {/* MILJÖ & CERTIFIKAT */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <Leaf className="w-5 h-5 text-primary-500" />
        Miljö & Certifikat
       </h2>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
         <input
          type="checkbox"
          checked={isEcoCertified}
          onChange={(e) => setIsEcoCertified(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-green-500 focus:ring-green-500"
         />
         <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-green-500" />
          <span className="text-gray-700 dark:text-gray-300">Miljöcertifierad</span>
         </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
         <input
          type="checkbox"
          checked={isRecyclable}
          onChange={(e) => setIsRecyclable(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
         />
         <span className="text-gray-700 dark:text-gray-300">Återvinningsbar</span>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 cursor-pointer">
         <input
          type="checkbox"
          checked={isHazardous}
          onChange={(e) => setIsHazardous(e.target.checked)}
          className="w-5 h-5 rounded border-gray-300 text-yellow-500 focus:ring-yellow-500"
         />
         <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <span className="text-gray-700 dark:text-gray-300">Farligt gods/Kemikalie</span>
         </div>
        </label>
       </div>
      </div>

      {/* ANTECKNINGAR */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Anteckningar
       </label>
       <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
        rows={3}
        placeholder="Interna noteringar..."
       />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
       <Button 
        type="submit" 
        disabled={createMutation.isPending}
        className="flex-1 bg-primary-500 hover:bg-primary-600 py-4"
       >
        <Save size={16} className="mr-2" />
        {createMutation.isPending ? 'Sparar...' : 'Spara Material'}
       </Button>
       <Button
        type="button"
        variant="secondary"
        onClick={() => router.back()}
        disabled={createMutation.isPending}
        className="py-4"
       >
        Avbryt
       </Button>
      </div>
     </form>
    </div>
   </main>
  </div>
 )
}
