// app/components/invoices/InvoiceOCRUpload.tsx
// ✅ AI-powered invoice OCR upload component
'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import type { InvoiceOCRResult } from '@/lib/ai/frost-bygg-ai-integration';

interface InvoiceOCRUploadProps {
  onInvoiceExtracted?: (data: InvoiceOCRResult) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function InvoiceOCRUpload({ 
  onInvoiceExtracted, 
  onError,
  className = '' 
}: InvoiceOCRUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InvoiceOCRResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (selectedFile: File) => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(selectedFile.type)) {
      const err = 'Ogiltig filtyp. Ladda upp PNG, JPEG eller PDF';
      setError(err);
      if (onError) onError(err);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      const err = 'Filen är för stor. Maximal storlek är 10MB';
      setError(err);
      if (onError) onError(err);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/ai/invoice-ocr', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'OCR-bearbetning misslyckades');
      }

      setResult(data.data);
      
      if (onInvoiceExtracted) {
        onInvoiceExtracted(data.data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Okänt fel';
      setError(errorMessage);
      if (onError) onError(errorMessage);
      console.error('[InvoiceOCRUpload] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [onInvoiceExtracted, onError]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [handleFile]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  }, [handleFile]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ladda upp faktura
        </label>
        
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            }
            ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}
          `}
        >
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleChange}
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bearbetar faktura...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Dra och släpp faktura här, eller klicka för att välja fil
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPEG eller PDF (max 10MB)
              </p>
            </div>
          )}
        </div>

        {file && !loading && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Vald fil: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {result && (
        <div className="p-6 bg-gradient-to-br from-white via-blue-50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-800 rounded-xl shadow-xl border-2 border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-3 mb-4">
            <svg
              className="h-5 w-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Faktura extraherad
            </h3>
            <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
              Förtroende: {result.ocrConfidence}%
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Leverantör</p>
              <p className="font-semibold text-gray-900 dark:text-white">{result.supplierName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Fakturanummer</p>
              <p className="font-semibold text-gray-900 dark:text-white">{result.invoiceNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Datum</p>
              <p className="font-semibold text-gray-900 dark:text-white">{result.invoiceDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Totalt belopp</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {result.totalAmount.toLocaleString('sv-SE')} {result.currency}
              </p>
            </div>
          </div>

          {result.lineItems && result.lineItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Radartiklar:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {result.lineItems.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                    {item.description} - {item.quantity} {item.unit} × {item.unitPrice.toLocaleString('sv-SE')} kr
                  </div>
                ))}
                {result.lineItems.length > 5 && (
                  <p className="text-xs text-gray-500">...och {result.lineItems.length - 5} fler</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

