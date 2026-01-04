import { Suspense } from 'react'
import NewInvoiceContent from './NewInvoiceContent'

export default function NewInvoicePage() {
 return (
  <Suspense fallback={
   <div className="min-h-screen bg-white flex items-center justify-center">
    <div className="text-gray-500">Laddar...</div>
   </div>
  }>
   <NewInvoiceContent />
  </Suspense>
 )
}
