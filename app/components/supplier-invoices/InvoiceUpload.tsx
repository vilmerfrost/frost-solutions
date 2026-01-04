// app/components/supplier-invoices/InvoiceUpload.tsx
'use client'

import React, { useState, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Upload, FileText, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useUploadSupplierInvoice } from '@/hooks/useSupplierInvoices'
import { useSuppliers } from '@/hooks/useSuppliers'
import { useProjects } from '@/hooks/useProjects'
import { InvoiceOCRUpload } from '@/components/invoices/InvoiceOCRUpload'
import type { InvoiceOCRResult } from '@/lib/ai/frost-bygg-ai-integration'

interface InvoiceUploadProps {
 onComplete: (data: { invoiceId: string }) => void
}

export function InvoiceUpload({ onComplete }: InvoiceUploadProps) {
 const [file, setFile] = useState<File | null>(null)
 const [dragActive, setDragActive] = useState(false)
 const [supplierId, setSupplierId] = useState('')
 const [projectId, setProjectId] = useState('')
 const [ocrResult, setOcrResult] = useState<any>(null)
 const fileInputRef = useRef<HTMLInputElement>(null)

 const uploadMutation = useUploadSupplierInvoice()
 const { data: suppliers } = useSuppliers()
 const { data: projects } = useProjects()
 const suppliersReady = Array.isArray(suppliers)
 const noSuppliers = suppliersReady && suppliers.length === 0

 const handleDrag = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  if (e.type === 'dragenter' || e.type === 'dragover') {
   setDragActive(true)
  } else if (e.type === 'dragleave') {
   setDragActive(false)
  }
 }

 const handleDrop = (e: React.DragEvent) => {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)

  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
   handleFile(e.dataTransfer.files[0])
  }
 }

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  e.preventDefault()
  if (e.target.files && e.target.files[0]) {
   handleFile(e.target.files[0])
  }
 }

 const handleFile = (file: File) => {
  const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
  if (!validTypes.includes(file.type)) {
   alert('Endast PDF, JPG och PNG filer är tillåtna')
   return
  }

  if (file.size > 10 * 1024 * 1024) {
   alert('Filen är för stor. Max 10MB.')
   return
  }

  setFile(file)
 }

 const handleUpload = async () => {
  if (!file || !supplierId) {
   alert('Välj leverantör och fil')
   return
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('supplier_id', supplierId)
  if (projectId) {
   formData.append('project_id', projectId)
  }

  try {
   const result = await uploadMutation.mutateAsync(formData)
   setOcrResult(result.data)
  } catch (error) {
   console.error('Upload error:', error)
  }
 }

 const handleConfirm = () => {
  if (ocrResult?.invoiceId) {
   onComplete({ invoiceId: ocrResult.invoiceId })
  }
 }

 const handleReset = () => {
  setFile(null)
  setOcrResult(null)
  if (fileInputRef.current) {
   fileInputRef.current.value = ''
  }
 }

 return (
  <div className="space-y-6">
   {noSuppliers && (
    <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-900/20 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
     <span>
      Ingen leverantör registrerad ännu. Skapa en leverantör innan du laddar upp leverantörsfakturor.
     </span>
     <Link href="/suppliers/new">
      <Button size="sm" className="bg-primary-500 hover:bg-primary-600 hover: hover:">
       Skapa leverantör
      </Button>
     </Link>
    </div>
   )}

   {/* Supplier & Project Selection */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Select
     label="Leverantör *"
     value={supplierId}
     onChange={(e) => setSupplierId(e.target.value)}
     disabled={!suppliersReady || noSuppliers}
    >
     {suppliersReady ? (
      <>
       <option value="">Välj leverantör</option>
       {suppliers?.map((supplier) => (
        <option key={supplier.id} value={supplier.id}>
         {supplier.name}
        </option>
       ))}
      </>
     ) : (
      <option value="">Inga leverantörer ännu</option>
     )}
    </Select>

    <Select label="Projekt (valfritt)" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
     <option value="">Inget projekt</option>
     {projects?.map((project) => (
      <option key={project.id} value={project.id}>
       {project.name}
      </option>
     ))}
    </Select>
   </div>

   {/* Upload Area */}
   {!file && (
    <div
     onDragEnter={handleDrag}
     onDragLeave={handleDrag}
     onDragOver={handleDrag}
     onDrop={handleDrop}
     className={`border-2 border-dashed rounded-[8px] p-12 text-center transition-all duration-200 ${
      dragActive
       ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10'
       : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 dark:hover:border-emerald-500'
     }`}
    >
     <div className="flex justify-center mb-4">
      <div className="p-4 bg-primary-500 hover:bg-primary-600 rounded-full">
       <Upload size={48} className="text-white" />
      </div>
     </div>
     <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
      Ladda upp faktura för OCR
     </h3>
     <p className="text-gray-600 dark:text-gray-400 mb-6">
      Dra och släpp en faktura här eller klicka för att välja fil
     </p>
     <input
      ref={fileInputRef}
      type="file"
      className="hidden"
      onChange={handleChange}
      accept=".pdf,.jpg,.jpeg,.png"
     />
     <Button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      size="lg"
      className="bg-primary-500 hover:bg-primary-600 hover: hover: disabled:opacity-60"
      disabled={!suppliersReady || noSuppliers}
     >
      <FileText size={20} className="mr-2" />
      Välj fil
     </Button>
     <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Stöder PDF, JPG, PNG (max 10MB)</p>
    </div>
   )}

   {/* File Selected */}
   {file && !ocrResult && (
    <div className="bg-white dark:from-gray-800 dark:/50 dark:to-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
     <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
       <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
        <FileText size={24} className="text-emerald-600 dark:text-emerald-400" />
       </div>
       <div>
        <p className="font-semibold text-gray-900 dark:text-white">{file.name}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
         {(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
       </div>
      </div>
      <Button variant="ghost" onClick={handleReset} size="sm">
       Byt fil
      </Button>
     </div>
     <Button
      type="button"
      onClick={handleUpload}
      disabled={uploadMutation.isPending || !supplierId}
      size="lg"
      className="w-full bg-primary-500 hover:bg-primary-600 hover: hover:"
     >
      {uploadMutation.isPending ? (
       <>
        <Loader size={20} className="mr-2 animate-spin" />
        Analyserar faktura...
       </>
      ) : (
       <>
        <Upload size={20} className="mr-2" />
        Ladda upp & Analysera
       </>
      )}
     </Button>
    </div>
   )}

   {/* OCR Result */}
   {ocrResult && (
    <div className="bg-white dark:from-gray-800 dark:/50 dark:to-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-6">
     <div className="flex items-center gap-3 mb-6">
      <div
       className={`p-2 rounded-lg ${
        (ocrResult.ocr?.confidence || 0) >= 70
         ? 'bg-green-100 dark:bg-green-900/30'
         : 'bg-yellow-100 dark:bg-yellow-900/30'
       }`}
      >
       {(ocrResult.ocr?.confidence || 0) >= 70 ? (
        <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
       ) : (
        <AlertCircle size={24} className="text-yellow-600 dark:text-yellow-400" />
       )}
      </div>
      <div>
       <h3 className="text-xl font-semibold text-gray-900 dark:text-white">OCR Resultat</h3>
       <p className="text-sm text-gray-600 dark:text-gray-400">
        Säkerhet: {ocrResult.ocr?.confidence || 0}%
       </p>
      </div>
     </div>

     {/* Confidence Warning */}
     {(ocrResult.ocr?.confidence || 0) < 70 && (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
       <p className="text-sm text-yellow-800 dark:text-yellow-300">
        <strong>OBS:</strong> Låg säkerhet vid igenkänning. Kontrollera fakturan manuellt efter
        skapande.
       </p>
      </div>
     )}

     {/* Actions */}
     <div className="flex gap-3">
      <Button
       type="button"
       onClick={handleConfirm}
       size="lg"
       className="flex-1 bg-primary-500 hover:bg-primary-600 hover: hover:"
      >
       <CheckCircle size={20} className="mr-2" />
       Fortsätt till faktura
      </Button>
      <Button type="button" variant="outline" onClick={handleReset} size="lg">
       Ladda upp ny fil
      </Button>
     </div>
    </div>
   )}
  </div>
 )
}

