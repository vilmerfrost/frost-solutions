// app/components/supplier-invoices/PaymentForm.tsx
'use client'

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useRegisterPayment } from '@/hooks/useSupplierInvoices'
import { Save, X } from 'lucide-react'

interface PaymentFormProps {
 invoiceId: string
 maxAmount: number
 currency: string
 onSuccess: () => void
 onCancel: () => void
}

export function PaymentForm({ invoiceId, maxAmount, currency, onSuccess, onCancel }: PaymentFormProps) {
 const registerMutation = useRegisterPayment(invoiceId)

 const [formData, setFormData] = useState({
  amount: maxAmount,
  paymentDate: new Date().toISOString().split('T')[0],
  payment_method: 'bankgiro',
  notes: ''
 })

 const [errors, setErrors] = useState<Record<string, string>>({})

 const validate = () => {
  const newErrors: Record<string, string> = {}

  if (formData.amount <= 0) {
   newErrors.amount = 'Belopp måste vara större än 0'
  }
  if (formData.amount > maxAmount) {
   newErrors.amount = `Belopp kan inte överstiga ${maxAmount.toLocaleString('sv-SE')} ${currency}`
  }
  if (!formData.paymentDate) {
   newErrors.paymentDate = 'Betalningsdatum är obligatoriskt'
  }

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
 }

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validate()) return

  await registerMutation.mutateAsync({
   amount: formData.amount,
   paymentDate: formData.paymentDate,
   method: formData.payment_method,
   notes: formData.notes || undefined
  })
  onSuccess()
 }

 return (
  <form onSubmit={handleSubmit} className="space-y-4">
   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Registrera betalning</h3>

   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input
     label="Belopp *"
     type="number"
     step="0.01"
     min="0"
     max={maxAmount}
     value={formData.amount}
     onChange={(e) => {
      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
      if (errors.amount) setErrors({ ...errors, amount: '' })
     }}
     error={errors.amount}
    />

    <Input
     label="Betalningsdatum *"
     type="date"
     value={formData.paymentDate}
     onChange={(e) => {
      setFormData({ ...formData, paymentDate: e.target.value })
      if (errors.paymentDate) setErrors({ ...errors, paymentDate: '' })
     }}
     error={errors.paymentDate}
    />
   </div>

   <Select
    label="Betalningsmetod"
    value={formData.payment_method}
    onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
   >
    <option value="bankgiro">Bankgiro</option>
    <option value="check">Check</option>
    <option value="cash">Kontant</option>
    <option value="swish">Swish</option>
    <option value="card">Kort</option>
    <option value="other">Övrigt</option>
   </Select>

   <Textarea
    label="Noteringar"
    value={formData.notes}
    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
    rows={3}
    placeholder="Valfria noteringar om betalningen..."
   />

   <div className="flex gap-3 pt-4">
    <Button type="submit" disabled={registerMutation.isPending} className="flex-1">
     <Save size={16} className="mr-2" />
     {registerMutation.isPending ? 'Registrerar...' : 'Registrera betalning'}
    </Button>
    <Button type="button" variant="secondary" onClick={onCancel}>
     <X size={16} className="mr-2" />
     Avbryt
    </Button>
   </div>
  </form>
 )
}

