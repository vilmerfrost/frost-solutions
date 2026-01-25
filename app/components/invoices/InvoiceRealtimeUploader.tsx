'use client'

import { useState, useEffect, useCallback } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import { toast } from 'sonner'
import { Upload, FileText, Brain, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'saving' | 'complete' | 'error'

interface ParsedInvoiceData {
  supplier_name?: string
  total_amount?: number
  currency?: string
  due_date?: string
  ocr_number?: string
}

interface InvoiceRealtimeUploaderProps {
  tenantId: string
  onComplete?: (invoiceId: string, data: ParsedInvoiceData) => void
  onError?: (error: string) => void
  className?: string
}

const statusConfig: Record<ProcessingStatus, { icon: React.ReactNode; color: string }> = {
  idle: { icon: null, color: '' },
  uploading: { icon: <Upload className="w-4 h-4 animate-pulse" />, color: 'text-blue-500' },
  processing: { icon: <FileText className="w-4 h-4 animate-pulse" />, color: 'text-blue-500' },
  analyzing: { icon: <Brain className="w-4 h-4 animate-bounce" />, color: 'text-purple-500' },
  saving: { icon: <Save className="w-4 h-4 animate-pulse" />, color: 'text-green-500' },
  complete: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-green-600' },
  error: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-red-500' },
}

export function InvoiceRealtimeUploader({ 
  tenantId, 
  onComplete,
  onError,
  className = '' 
}: InvoiceRealtimeUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<ProcessingStatus>('idle')
  const [message, setMessage] = useState('')
  const [parsedData, setParsedData] = useState<ParsedInvoiceData | null>(null)
  const [dragActive, setDragActive] = useState(false)

  const resetState = useCallback(() => {
    setStatus('idle')
    setMessage('')
    setParsedData(null)
    setUploading(false)
  }, [])

  const handleUpload = async (file: File) => {
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Endast PDF-filer stöds')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Filen är för stor. Maximal storlek är 10MB')
      return
    }

    setUploading(true)
    setStatus('uploading')
    setMessage('Laddar upp fil...')
    setParsedData(null)

    try {
      // 1. Upload file to Storage
      const filePath = `${tenantId}/${Date.now()}_${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(filePath, file)

      if (uploadError) {
        throw new Error(`Uppladdning misslyckades: ${uploadError.message}`)
      }

      setStatus('processing')
      setMessage('Skapar faktura...')

      // 2. Create invoice record in DB to get an ID
      // Cast to any to bypass strict typing for invoices table
      const { data: invoice, error: dbError } = await (supabase as any)
        .from('invoices')
        .insert({ 
          tenant_id: tenantId, 
          file_path: filePath, 
          status: 'processing' 
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Databasfel: ${dbError.message}`)
      }

      // 3. Subscribe to Realtime channel BEFORE invoking the function
      const channel = supabase.channel(`invoice-processing-${invoice.id}`)
        .on(
          'broadcast',
          { event: 'status' },
          (payload) => {
            console.log('📡 Realtime update:', payload)
            const { status: newStatus, message: newMessage, data } = payload.payload as {
              status: ProcessingStatus
              message: string
              data?: ParsedInvoiceData
            }
            
            setStatus(newStatus)
            setMessage(newMessage)
            
            if (data) {
              setParsedData(data)
            }
            
            if (newStatus === 'complete') {
              toast.success('Fakturan tolkad!')
              setUploading(false)
              if (onComplete) {
                onComplete(invoice.id, data || {})
              }
              // Unsubscribe after completion
              setTimeout(() => {
                supabase.removeChannel(channel)
              }, 1000)
            }
            
            if (newStatus === 'error') {
              toast.error(newMessage || 'Ett fel uppstod')
              setUploading(false)
              if (onError) {
                onError(newMessage)
              }
              supabase.removeChannel(channel)
            }
          }
        )
        .subscribe()

      // 4. Invoke Edge Function to start AI processing
      const { error: funcError } = await supabase.functions.invoke('parse-invoice', {
        body: { 
          invoice_id: invoice.id,
          file_path: filePath,
          tenant_id: tenantId 
        }
      })

      if (funcError) {
        supabase.removeChannel(channel)
        throw new Error(`Edge Function fel: ${funcError.message}`)
      }

    } catch (error) {
      console.error('[InvoiceRealtimeUploader] Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Något gick fel vid uppladdningen'
      toast.error(errorMessage)
      setStatus('error')
      setMessage(errorMessage)
      setUploading(false)
      if (onError) {
        onError(errorMessage)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }, [tenantId])

  const statusInfo = statusConfig[status]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${dragActive 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
          }
          ${uploading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700'}
        `}
      >
        <input 
          type="file" 
          accept=".pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />
        
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Bearbetar faktura...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dra och släpp faktura här
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                eller klicka för att välja fil (PDF, max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Status Indicator */}
      {status !== 'idle' && (
        <div className={`flex items-center gap-3 p-4 rounded-lg bg-gray-100 dark:bg-gray-800 ${statusInfo.color}`}>
          {statusInfo.icon}
          <span className="text-sm font-medium">{message}</span>
        </div>
      )}

      {/* Parsed Data Preview */}
      {parsedData && status === 'complete' && (
        <div className="p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h3 className="font-semibold text-green-800 dark:text-green-200">
              Faktura tolkad
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {parsedData.supplier_name && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Leverantör</p>
                <p className="font-medium text-gray-900 dark:text-white">{parsedData.supplier_name}</p>
              </div>
            )}
            {parsedData.total_amount !== undefined && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Belopp</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {parsedData.total_amount.toLocaleString('sv-SE')} {parsedData.currency || 'SEK'}
                </p>
              </div>
            )}
            {parsedData.due_date && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Förfallodatum</p>
                <p className="font-medium text-gray-900 dark:text-white">{parsedData.due_date}</p>
              </div>
            )}
            {parsedData.ocr_number && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">OCR-nummer</p>
                <p className="font-medium text-gray-900 dark:text-white">{parsedData.ocr_number}</p>
              </div>
            )}
          </div>

          <button
            onClick={resetState}
            className="mt-4 text-sm text-green-600 dark:text-green-400 hover:underline"
          >
            Ladda upp ny faktura
          </button>
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
          </div>
          <button
            onClick={resetState}
            className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
          >
            Försök igen
          </button>
        </div>
      )}
    </div>
  )
}

export default InvoiceRealtimeUploader
