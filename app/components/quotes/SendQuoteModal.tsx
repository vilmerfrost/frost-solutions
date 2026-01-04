// app/components/quotes/SendQuoteModal.tsx
'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useSendQuote } from '@/hooks/useQuoteActions'
import { Mail } from 'lucide-react'

interface SendQuoteModalProps {
 open: boolean
 onClose: () => void
 quoteId: string
 quoteNumber: string
 customerEmail?: string
}

export function SendQuoteModal({ open, onClose, quoteId, quoteNumber, customerEmail }: SendQuoteModalProps) {
 const [email, setEmail] = useState(customerEmail || '')
 const [error, setError] = useState('')

 const sendMutation = useSendQuote()

 const handleSend = async () => {
  if (!email.trim()) {
   setError('Email är obligatorisk')
   return
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
   setError('Ogiltig email-adress')
   return
  }

  await sendMutation.mutateAsync({ quoteId, to: email })
  onClose()
  setEmail('')
  setError('')
 }

 return (
  <Dialog
   open={open}
   onClose={onClose}
   title="Skicka Offert via Email"
   footer={
    <>
     <Button variant="outline" onClick={onClose}>
      Avbryt
     </Button>
     <Button onClick={handleSend} disabled={sendMutation.isPending}>
      <Mail size={16} className="mr-2" />
      {sendMutation.isPending ? 'Skickar...' : 'Skicka'}
     </Button>
    </>
   }
  >
   <div className="space-y-4">
    <p className="text-sm text-gray-600">
     Skicka offert <strong>{quoteNumber}</strong> via email. PDF-filen bifogas automatiskt.
    </p>

    <Input
     label="Mottagarens Email *"
     type="email"
     placeholder="exempel@email.com"
     value={email}
     onChange={(e) => {
      setEmail(e.target.value)
      setError('')
     }}
     error={error}
    />

    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
     <p className="text-sm text-blue-800">
      <strong>Ämne:</strong> Offert {quoteNumber}
     </p>
     <p className="text-sm text-blue-600 mt-1">
      (Genereras automatiskt av systemet)
     </p>
    </div>
   </div>
  </Dialog>
 )
}

