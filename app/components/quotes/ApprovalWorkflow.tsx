// app/components/quotes/ApprovalWorkflow.tsx
'use client'

import React, { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useApproveQuote } from '@/hooks/useQuoteActions'
import { CheckCircle } from 'lucide-react'

interface ApprovalWorkflowProps {
 open: boolean
 onClose: () => void
 quoteId: string
}

export function ApprovalWorkflow({ open, onClose, quoteId }: ApprovalWorkflowProps) {
 const [reason, setReason] = useState('')
 const [level] = useState(1) // Multi-level kan implementeras senare

 const approveMutation = useApproveQuote()

 const handleApprove = async () => {
  await approveMutation.mutateAsync({ quoteId, level, reason })
  onClose()
  setReason('')
 }

 return (
  <Dialog
   open={open}
   onClose={onClose}
   title="Godkänn Offert"
   footer={
    <>
     <Button variant="outline" onClick={onClose}>
      Avbryt
     </Button>
     <Button onClick={handleApprove} disabled={approveMutation.isPending}>
      <CheckCircle size={16} className="mr-2" />
      {approveMutation.isPending ? 'Godkänner...' : 'Godkänn'}
     </Button>
    </>
   }
  >
   <div className="space-y-4">
    <p className="text-sm text-gray-600">
     Du håller på att godkänna denna offert. Detta kommer att ändra statusen till "godkänd".
    </p>

    <Textarea
     label="Kommentar (valfritt)"
     placeholder="Lägg till en kommentar..."
     value={reason}
     onChange={(e) => setReason(e.target.value)}
     rows={4}
    />

    <div className="bg-green-50 border border-green-200 rounded-md p-3">
     <p className="text-sm text-green-800">
      Godkännandet kommer att loggas i historiken.
     </p>
    </div>
   </div>
  </Dialog>
 )
}

