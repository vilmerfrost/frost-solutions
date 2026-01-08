'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/input'
import { useCreateSupplier } from '@/hooks/useSuppliers'

interface SupplierFormProps {
 redirectTo?: string
}

export function SupplierForm({ redirectTo = '/supplier-invoices/new' }: SupplierFormProps) {
 const router = useRouter()
 const createSupplier = useCreateSupplier()

 const [formData, setFormData] = useState({
  name: '',
  org_number: '',
  email: '',
  phone: '',
  notes: ''
 })

 const [errors, setErrors] = useState<Record<string, string>>({})

 const validate = () => {
  const newErrors: Record<string, string> = {}

  if (!formData.name.trim()) {
   newErrors.name = 'Namn är obligatoriskt'
  }

  if (formData.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
   newErrors.email = 'Ogiltig e-postadress'
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
 }

 const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault()
  if (!validate()) {
   return
  }

  try {
   await createSupplier.mutateAsync({
    name: formData.name.trim(),
    org_number: formData.org_number.trim() || null,
    email: formData.email.trim() || null,
    phone: formData.phone.trim() || null,
    notes: formData.notes.trim() || null
   })

   router.push(redirectTo)
  } catch (error) {
   // Errors hanteras redan av mutationens onError
  }
 }

 return (
  <form onSubmit={handleSubmit} className="space-y-6">
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
     Leverantörsinformation
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <Input
      label="Namn *"
      value={formData.name}
      onChange={(e) => {
       setFormData((prev) => ({ ...prev, name: e.target.value }))
       if (errors.name) setErrors((prev) => ({ ...prev, name: '' }))
      }}
      error={errors.name}
      placeholder="T.ex. ByggPartner AB"
     />

     <Input
      label="Organisationsnummer"
      value={formData.org_number}
      onChange={(e) => setFormData((prev) => ({ ...prev, org_number: e.target.value }))}
      placeholder="T.ex. 556123-4567"
     />

     <Input
      label="E-post"
      type="email"
      value={formData.email}
      onChange={(e) => {
       setFormData((prev) => ({ ...prev, email: e.target.value }))
       if (errors.email) setErrors((prev) => ({ ...prev, email: '' }))
      }}
      error={errors.email}
      placeholder="kontakt@leverantor.se"
     />

     <Input
      label="Telefon"
      value={formData.phone}
      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
      placeholder="+46 70 123 45 67"
     />
    </div>

    <div className="mt-4">
     <Textarea
      label="Anteckningar (internt)"
      value={formData.notes}
      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
      rows={4}
      placeholder="Valfria interna anteckningar om leverantören..."
     />
    </div>
   </div>

   <div className="flex items-center justify-end gap-3">
    <Button
     type="submit"
     size="lg"
     disabled={createSupplier.isPending}
     className="bg-primary-500 hover:bg-primary-600 hover: hover:"
    >
     {createSupplier.isPending ? 'Sparar...' : 'Spara leverantör'}
    </Button>
   </div>
  </form>
 )
}


