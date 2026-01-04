'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'

interface FileUploadProps {
 entityType: 'project' | 'invoice'
 entityId: string
 onUploadComplete?: (file: { url: string; fileName: string }) => void
 className?: string
}

/**
 * Component for uploading files to projects or invoices
 */
export default function FileUpload({ entityType, entityId, onUploadComplete, className = '' }: FileUploadProps) {
 const [uploading, setUploading] = useState(false)
 const [dragActive, setDragActive] = useState(false)

 async function handleFileUpload(file: File) {
  if (!file) return

  // Validate file
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
   toast.error('Filen är för stor (max 10MB)')
   return
  }

  setUploading(true)
  try {
   const formData = new FormData()
   formData.append('file', file)
   formData.append('entityType', entityType)
   formData.append('entityId', entityId)

   const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
   })

   const result = await response.json()

   if (!response.ok || result.error) {
    throw new Error(result.error || 'Upload failed')
   }

   toast.success(`Filen "${result.fileName}" har laddats upp!`)
   
   if (onUploadComplete) {
    onUploadComplete({
     url: result.url,
     fileName: result.fileName,
    })
   }
  } catch (err: any) {
   console.error('Error uploading file:', err)
   toast.error('Kunde inte ladda upp fil: ' + (err.message || 'Okänt fel'))
  } finally {
   setUploading(false)
  }
 }

 function handleDrag(e: React.DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  if (e.type === 'dragenter' || e.type === 'dragover') {
   setDragActive(true)
  } else if (e.type === 'dragleave') {
   setDragActive(false)
  }
 }

 function handleDrop(e: React.DragEvent) {
  e.preventDefault()
  e.stopPropagation()
  setDragActive(false)

  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
   handleFileUpload(e.dataTransfer.files[0])
  }
 }

 function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
  if (e.target.files && e.target.files[0]) {
   handleFileUpload(e.target.files[0])
  }
 }

 return (
  <div className={className}>
   <div
    onDragEnter={handleDrag}
    onDragLeave={handleDrag}
    onDragOver={handleDrag}
    onDrop={handleDrop}
    className={`
     border-2 border-dashed rounded-[8px] p-6 text-center transition-colors
     ${dragActive 
      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
      : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50'
     }
     ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
    `}
   >
    <input
     type="file"
     onChange={handleFileInput}
     disabled={uploading}
     className="hidden"
     id={`file-upload-${entityId}`}
     accept="image/*,.pdf,.txt"
    />
    <label
     htmlFor={`file-upload-${entityId}`}
     className="cursor-pointer block"
    >
     {uploading ? (
      <div className="space-y-2">
       <div className="animate-spin text-4xl">⏳</div>
       <p className="text-sm text-gray-600 dark:text-gray-400">Laddar upp...</p>
      </div>
     ) : (
      <div className="space-y-2">
       <div className="text-4xl">📎</div>
       <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        Klicka eller dra fil här för att ladda upp
       </p>
       <p className="text-xs text-gray-500 dark:text-gray-400">
        Max 10MB • Bilder, PDF, textfiler
       </p>
      </div>
     )}
    </label>
   </div>
  </div>
 )
}

