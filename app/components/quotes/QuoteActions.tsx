// app/components/quotes/QuoteActions.tsx
'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { SendQuoteModal } from './SendQuoteModal'
import { ApprovalWorkflow } from './ApprovalWorkflow'
import { useConvertToProject, useDuplicateQuote } from '@/hooks/useQuoteActions'
import { QuotesAPI } from '@/lib/api/quotes'
import { Mail, CheckCircle, Copy, FolderPlus, Download } from 'lucide-react'
import type { Quote } from '@/types/quotes'

interface QuoteActionsProps {
 quote: Quote
}

export function QuoteActions({ quote }: QuoteActionsProps) {
 const [showSendModal, setShowSendModal] = useState(false)
 const [showApprovalModal, setShowApprovalModal] = useState(false)

 const convertMutation = useConvertToProject()
 const duplicateMutation = useDuplicateQuote()

 const handleConvert = () => {
  if (confirm('Vill du konvertera denna offert till ett projekt?')) {
   convertMutation.mutate(quote.id)
  }
 }

 const handleDuplicate = () => {
  duplicateMutation.mutate(quote.id)
 }

 const handleDownloadPDF = () => {
  window.open(QuotesAPI.getPDFUrl(quote.id), '_blank')
 }

 const canSend = quote.status === 'draft' || quote.status === 'approved' || quote.status === 'sent'
 const canApprove = quote.status === 'pending_approval'
 const canConvert = quote.status === 'accepted' || quote.status === 'approved'

 return (
  <>
   <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-xl border border-gray-200 dark:border-gray-700 p-4 backdrop-blur-sm bg-opacity-95">
    <div className="flex flex-wrap gap-3">
     <Button
      variant="outline"
      onClick={() => setShowSendModal(true)}
      disabled={!canSend}
      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
     >
      <Mail size={16} className="mr-2" />
      Skicka via Email
     </Button>

     <Button
      variant="outline"
      onClick={handleDownloadPDF}
      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
     >
      <Download size={16} className="mr-2" />
      Ladda ner PDF
     </Button>

     {canApprove && (
      <Button
       variant="outline"
       onClick={() => setShowApprovalModal(true)}
       className="hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
      >
       <CheckCircle size={16} className="mr-2" />
       Godkänn
      </Button>
     )}

     {canConvert && (
      <Button
       onClick={handleConvert}
       disabled={convertMutation.isPending}
       className="bg-primary-500 hover:bg-primary-600 hover: hover: shadow-md hover:shadow-xl transition-all duration-200 disabled:opacity-50"
      >
       <FolderPlus size={16} className="mr-2" />
       Konvertera till Projekt
      </Button>
     )}

     <Button
      variant="outline"
      onClick={handleDuplicate}
      disabled={duplicateMutation.isPending}
      className="hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
     >
      <Copy size={16} className="mr-2" />
      Duplicera
     </Button>
    </div>
   </div>

   {/* Modals */}
   <SendQuoteModal
    open={showSendModal}
    onClose={() => setShowSendModal(false)}
    quoteId={quote.id}
    quoteNumber={quote.quote_number}
    customerEmail={quote.customer?.email}
   />

   {canApprove && (
    <ApprovalWorkflow
     open={showApprovalModal}
     onClose={() => setShowApprovalModal(false)}
     quoteId={quote.id}
    />
   )}
  </>
 )
}

