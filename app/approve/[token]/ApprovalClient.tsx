'use client'

import { useState } from 'react'
import { Check, X, AlertTriangle, Clock, DollarSign, Calendar, Building2, CheckCircle, XCircle } from 'lucide-react'

interface AtaData {
 id: string
 title?: string
 description?: string
 change_type?: 'ADDITION' | 'MODIFICATION' | 'UNFORESEEN'
 photos?: string[]
 estimated_hours_category?: string
 estimated_material_cost?: number
 ordered_by_name?: string
 customer_approval_status?: string
 customer_approval_timestamp?: string
 project_name: string
 created_at: string
}

interface ApprovalClientProps {
 ata: AtaData
 token: string
 alreadyProcessed: boolean
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; description: string }> = {
 ADDITION: { label: 'Tillägg', description: 'Nytt arbete som inte ingick i ursprungligt avtal' },
 MODIFICATION: { label: 'Ändring', description: 'Ändring av tidigare överenskommet arbete' },
 UNFORESEEN: { label: 'Oförutsett', description: 'Problem som upptäcktes under arbetets gång' },
}

export default function ApprovalClient({ ata, token, alreadyProcessed }: ApprovalClientProps) {
 const [submitting, setSubmitting] = useState(false)
 const [result, setResult] = useState<'approved' | 'rejected' | null>(null)
 const [error, setError] = useState<string | null>(null)

 const handleDecision = async (approved: boolean) => {
  setSubmitting(true)
  setError(null)

  try {
   const response = await fetch(`/app/api/approve/${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ approved }),
   })

   const data = await response.json()

   if (!response.ok) {
    throw new Error(data.error || 'Något gick fel')
   }

   setResult(approved ? 'approved' : 'rejected')
  } catch (err: any) {
   setError(err.message)
  } finally {
   setSubmitting(false)
  }
 }

 // Format hours category
 const hoursLabel = ata.estimated_hours_category === '2h' ? 'Ca 2 timmar' :
  ata.estimated_hours_category === '4-8h' ? 'Ca 4-8 timmar' :
  ata.estimated_hours_category === '>1dag' ? 'Mer än 1 dag' : null

 // Format material cost
 const materialLabel = ata.estimated_material_cost ? 
  (ata.estimated_material_cost >= 5000 ? 'Över 5 000 kr' : 'Ca 1 000 kr') : null

 const changeTypeInfo = ata.change_type ? CHANGE_TYPE_LABELS[ata.change_type] : null

 // Already processed state
 if (alreadyProcessed) {
  const wasApproved = ata.customer_approval_status === 'APPROVED_DIGITAL'
  return (
   <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
     {wasApproved ? (
      <>
       <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Redan godkänd</h1>
       <p className="text-gray-600">
        Detta ändringsarbete godkändes {ata.customer_approval_timestamp ? 
         new Date(ata.customer_approval_timestamp).toLocaleDateString('sv-SE', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
         }) : 'tidigare'}.
       </p>
      </>
     ) : (
      <>
       <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Redan nekad</h1>
       <p className="text-gray-600">
        Detta ändringsarbete nekades {ata.customer_approval_timestamp ? 
         new Date(ata.customer_approval_timestamp).toLocaleDateString('sv-SE', {
          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
         }) : 'tidigare'}.
       </p>
      </>
     )}
    </div>
   </div>
  )
 }

 // Result state
 if (result) {
  return (
   <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
     {result === 'approved' ? (
      <>
       <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Tack för ditt godkännande!</h1>
       <p className="text-gray-600">
        Arbetet kan nu påbörjas. Du kommer att få en faktura när arbetet är slutfört.
       </p>
      </>
     ) : (
      <>
       <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
       <h1 className="text-2xl font-bold text-gray-900 mb-2">Arbetet har nekats</h1>
       <p className="text-gray-600">
        Vi har registrerat att du inte vill ha detta arbete utfört. Kontakta oss om du har frågor.
       </p>
      </>
     )}
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-100 py-8 px-4">
   <div className="max-w-2xl mx-auto">
    {/* Header */}
    <div className="text-center mb-6">
     <h1 className="text-2xl font-bold text-gray-900 mb-1">Godkänn ändringsarbete</h1>
     <p className="text-gray-600">Granska informationen och ta ställning</p>
    </div>

    {/* Main Card */}
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
     {/* Project info */}
     <div className="bg-primary-500 text-white p-6">
      <div className="flex items-center gap-3 mb-2">
       <Building2 className="w-6 h-6" />
       <span className="text-primary-100 text-sm">Projekt</span>
      </div>
      <h2 className="text-xl font-bold">{ata.project_name}</h2>
     </div>

     {/* Content */}
     <div className="p-6 space-y-6">
      {/* Title & Type */}
      <div>
       <h3 className="text-xl font-bold text-gray-900 mb-2">
        {ata.title || 'Ändringsarbete'}
       </h3>
       {changeTypeInfo && (
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
         <span className="font-medium text-gray-700">{changeTypeInfo.label}</span>
         <span className="text-gray-500 text-sm">- {changeTypeInfo.description}</span>
        </div>
       )}
      </div>

      {/* Photos */}
      {ata.photos && ata.photos.length > 0 && (
       <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Dokumentation</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
         {ata.photos.map((photo, i) => (
          <a
           key={i}
           href={photo}
           target="_blank"
           rel="noopener noreferrer"
           className="aspect-square rounded-xl overflow-hidden hover:opacity-90 transition-opacity"
          >
           <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
          </a>
         ))}
        </div>
       </div>
      )}

      {/* Description */}
      {ata.description && (
       <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Beskrivning</h4>
        <p className="text-gray-600 whitespace-pre-wrap">{ata.description}</p>
       </div>
      )}

      {/* Estimates */}
      <div className="grid grid-cols-2 gap-4">
       {hoursLabel && (
        <div className="bg-gray-50 rounded-xl p-4">
         <div className="flex items-center gap-2 text-gray-500 mb-1">
          <Clock className="w-4 h-4" />
          <span className="text-sm">Tid</span>
         </div>
         <p className="font-semibold text-gray-900">{hoursLabel}</p>
        </div>
       )}
       {materialLabel && (
        <div className="bg-gray-50 rounded-xl p-4">
         <div className="flex items-center gap-2 text-gray-500 mb-1">
          <DollarSign className="w-4 h-4" />
          <span className="text-sm">Material</span>
         </div>
         <p className="font-semibold text-gray-900">{materialLabel}</p>
        </div>
       )}
      </div>

      {/* Ordered by */}
      {ata.ordered_by_name && (
       <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-sm text-blue-700">
         <span className="font-medium">Beställd av:</span> {ata.ordered_by_name}
        </p>
       </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-2 text-gray-500 text-sm">
       <Calendar className="w-4 h-4" />
       <span>Skapad {new Date(ata.created_at).toLocaleDateString('sv-SE', {
        year: 'numeric', month: 'long', day: 'numeric'
       })}</span>
      </div>

      {/* Error message */}
      {error && (
       <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
        {error}
       </div>
      )}

      {/* Legal notice */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
       <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
         <p className="font-semibold mb-1">Juridiskt bindande</p>
         <p>Genom att klicka på "Godkänn" bekräftar du att du beställer detta arbete och accepterar att det kommer att faktureras.</p>
        </div>
       </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4 pt-4">
       <button
        onClick={() => handleDecision(false)}
        disabled={submitting}
        className="py-4 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
       >
        <X className="w-5 h-5" />
        Neka
       </button>
       <button
        onClick={() => handleDecision(true)}
        disabled={submitting}
        className="py-4 px-6 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
       >
        <Check className="w-5 h-5" />
        {submitting ? 'Sparar...' : 'Godkänn'}
       </button>
      </div>
     </div>
    </div>

    {/* Footer */}
    <p className="text-center text-gray-500 text-sm mt-6">
     Powered by Frost Solutions
    </p>
   </div>
  </div>
 )
}
