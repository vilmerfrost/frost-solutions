// app/components/invoices/InvoiceUploadArea.tsx
'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, Loader2, Folder } from 'lucide-react'
import { IconBadge } from '../ui/icon-badge'

interface InvoiceUploadAreaProps {
 onFileSelect: (file: File) => void
 maxSize?: number
 acceptedTypes?: string[]
 processing?: boolean
 success?: boolean
}

export function InvoiceUploadArea({
 onFileSelect,
 maxSize = 10 * 1024 * 1024, // 10MB default
 acceptedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
 processing = false,
 success = false,
}: InvoiceUploadAreaProps) {
 const [error, setError] = useState<string | null>(null)

 const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
  setError(null)
  
  if (rejectedFiles.length > 0) {
   const rejection = rejectedFiles[0]
   if (rejection.errors[0]?.code === 'file-too-large') {
    setError(`Filen är för stor. Max ${(maxSize / 1024 / 1024).toFixed(0)} MB.`)
   } else if (rejection.errors[0]?.code === 'file-invalid-type') {
    setError('Filtypen stöds inte. Använd PDF, JPG eller PNG.')
   } else {
    setError('Kunde inte läsa filen. Försök igen.')
   }
   return
  }

  if (acceptedFiles.length > 0) {
   onFileSelect(acceptedFiles[0])
  }
 }, [onFileSelect, maxSize])

 const { getRootProps, getInputProps, isDragActive } = useDropzone({
  onDrop,
  accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
  maxSize,
  multiple: false,
 })

 return (
  <div className="max-w-3xl mx-auto">
   {/* Upload Area */}
   <div
    {...getRootProps()}
    className={`
     relative h-[300px] border-2 border-dashed rounded-[8px] 
     flex flex-col items-center justify-center p-10 cursor-pointer
     transition-all duration-200
     ${isDragActive 
      ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' 
      : error
      ? 'border-error-500 bg-error-50 dark:bg-error-500/10'
      : success
      ? 'border-success-500 bg-success-50 dark:bg-success-500/10'
      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-500/5'
     }
    `}
   >
    <input {...getInputProps()} />
    
    {processing ? (
     <>
      <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
       Bearbetar faktura...
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
       AI:n extraherar information från dokumentet
      </p>
     </>
    ) : success ? (
     <>
      <CheckCircle className="w-12 h-12 text-success-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
       Klar!
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
       Fakturan har bearbetats framgångsrikt
      </p>
     </>
    ) : (
     <>
      <div className="text-[48px] mb-4">📄</div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
       Dra & släpp faktura hit
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
       eller klicka för att välja
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
       PDF, JPG, PNG
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500">
       Max storlek: {(maxSize / 1024 / 1024).toFixed(0)} MB
      </p>
      
      {!isDragActive && !error && (
       <button
        type="button"
        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-[6px] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
       >
        <Upload className="w-4 h-4" />
        Välj fil
       </button>
      )}
     </>
    )}
    
    {error && !processing && !success && (
     <div className="absolute inset-0 flex flex-col items-center justify-center">
      <div className="text-[48px] mb-4">⚠️</div>
      <h3 className="text-lg font-semibold text-error-700 dark:text-error-400 mb-2">
       {error}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
       Försök igen med en annan fil
      </p>
     </div>
    )}
   </div>

   {/* AI Badge */}
   <div className="mt-6 text-center">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-500/30 rounded-[6px]">
     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
      🤖 Powered by Google Gemini 2.0 Flash
     </span>
    </div>
   </div>

   {/* Features List */}
   <div className="mt-8 bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6">
    <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
     AI extraherar automatiskt:
    </h4>
    <ul className="space-y-2.5">
     {[
      'Leverantörsnamn och adress',
      'Fakturanummer och datum',
      'Förfallodatum',
      'Belopp (netto, moms, totalt)',
      'Radposter och beskrivningar',
      'Betalningsinformation',
     ].map((feature, index) => (
      <li key={index} className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
       <CheckCircle className="w-4 h-4 text-success-600 dark:text-success-400 flex-shrink-0" />
       <span>{feature}</span>
      </li>
     ))}
    </ul>
   </div>

   {/* Time Badge */}
   <div className="mt-4 flex justify-center">
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/30 rounded-[6px]">
     <span className="text-lg">⚡</span>
     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
      Normalt färdigt på ~10 sekunder
     </span>
    </div>
   </div>
  </div>
 )
}

