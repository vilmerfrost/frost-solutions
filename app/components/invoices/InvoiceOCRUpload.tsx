// app/components/invoices/InvoiceOCRUpload.tsx
// ✅ AI-powered invoice OCR upload component with mobile Field-First verification flow
'use client';

import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Upload } from 'lucide-react';
import type { InvoiceOCRResult } from '@/lib/ai/frost-bygg-ai-integration';
import { BASE_PATH } from '@/utils/url';
import { MobileVerificationFlow, type VerificationField } from '@/components/mobile/invoices/MobileVerificationFlow';
import { GloveFriendlyButton } from '@/components/mobile/GloveFriendlyButton';

interface InvoiceOCRUploadProps {
 onInvoiceExtracted?: (data: InvoiceOCRResult) => void;
 onError?: (error: string) => void;
 className?: string;
}

// Convert OCR result to verification fields
function ocrResultToVerificationFields(result: InvoiceOCRResult): VerificationField[] {
 const getConfidence = (base: number): 'high' | 'medium' | 'low' => {
  if (base >= 85) return 'high';
  if (base >= 60) return 'medium';
  return 'low';
 };

 const confidence = getConfidence(result.ocrConfidence);

 return [
  { id: 'supplier', label: 'Leverantör', value: result.supplierName || '', confidence, type: 'text' },
  { id: 'invoiceNumber', label: 'Fakturanummer', value: result.invoiceNumber || '', confidence, type: 'text' },
  { id: 'invoiceDate', label: 'Fakturadatum', value: result.invoiceDate || '', confidence, type: 'date' },
  { id: 'dueDate', label: 'Förfallodatum', value: result.dueDate || '', confidence, type: 'date' },
  { id: 'totalAmount', label: 'Totalt belopp', value: result.totalAmount?.toString() || '0', confidence, type: 'currency' },
 ];
}

// Convert verified fields back to OCR result format
function verificationFieldsToOcrResult(fields: VerificationField[], originalResult: InvoiceOCRResult): InvoiceOCRResult {
 const fieldMap = Object.fromEntries(fields.map(f => [f.id, f.value]));
 
 return {
  ...originalResult,
  supplierName: fieldMap.supplier || originalResult.supplierName,
  invoiceNumber: fieldMap.invoiceNumber || originalResult.invoiceNumber,
  invoiceDate: fieldMap.invoiceDate || originalResult.invoiceDate,
  dueDate: fieldMap.dueDate || originalResult.dueDate,
  totalAmount: parseFloat(fieldMap.totalAmount) || originalResult.totalAmount,
  ocrConfidence: 100, // User verified
 };
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
 const [showMobileVerification, setShowMobileVerification] = useState(false);

 // Convert OCR result to verification fields for mobile flow
 const verificationFields = useMemo(() => {
  if (!result) return [];
  return ocrResultToVerificationFields(result);
 }, [result]);

 // Handle mobile verification completion
 const handleMobileVerificationComplete = useCallback((verifiedFields: VerificationField[]) => {
  if (!result) return;
  
  const verifiedResult = verificationFieldsToOcrResult(verifiedFields, result);
  setResult(verifiedResult);
  setShowMobileVerification(false);
  
  if (onInvoiceExtracted) {
   onInvoiceExtracted(verifiedResult);
  }
 }, [result, onInvoiceExtracted]);

 // Handle mobile verification cancel
 const handleMobileVerificationCancel = useCallback(() => {
  setShowMobileVerification(false);
 }, []);

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

   const response = await fetch(`${BASE_PATH}/api/ai/invoice-ocr`, {
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

 // Mobile verification flow (full screen)
 if (showMobileVerification && result && verificationFields.length > 0) {
  return (
   <MobileVerificationFlow
    fields={verificationFields}
    onComplete={handleMobileVerificationComplete}
    onCancel={handleMobileVerificationCancel}
    title="Verifiera fakturadata"
   />
  );
 }

 return (
  <div className={`space-y-4 ${className}`}>
   {/* Mobile: Simplified upload UI */}
   <div className="md:hidden space-y-4">
    <label className="field-text-large block">Ladda upp faktura</label>
    
    {loading ? (
     <div className="field-card p-8 text-center">
      <svg
       className="animate-spin h-12 w-12 mx-auto text-orange-500"
       xmlns="http://www.w3.org/2000/svg"
       fill="none"
       viewBox="0 0 24 24"
      >
       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
      <p className="field-text mt-4">Bearbetar faktura...</p>
     </div>
    ) : (
     <div className="space-y-3">
      <label className="block">
       <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
       />
       <GloveFriendlyButton variant="primary" icon={Camera} onClick={() => {}}>
        Ta foto av faktura
       </GloveFriendlyButton>
      </label>
      
      <label className="block">
       <input
        type="file"
        accept="image/*,.pdf"
        onChange={handleChange}
        className="hidden"
       />
       <GloveFriendlyButton variant="secondary" icon={Upload} onClick={() => {}}>
        Välj fil
       </GloveFriendlyButton>
      </label>
     </div>
    )}

    {file && !loading && (
     <p className="text-sm text-gray-600 dark:text-gray-400">
      Vald fil: {file.name}
     </p>
    )}

    {error && (
     <div className="field-card-error p-4">
      <p className="font-semibold text-red-700">{error}</p>
     </div>
    )}

    {result && !showMobileVerification && (
     <div className="space-y-4">
      <div className="field-card p-4">
       <p className="field-text text-green-600 mb-4">✓ Faktura extraherad</p>
       <div className="space-y-2 text-sm">
        <div className="flex justify-between">
         <span className="text-gray-600">Leverantör:</span>
         <span className="font-semibold">{result.supplierName}</span>
        </div>
        <div className="flex justify-between">
         <span className="text-gray-600">Belopp:</span>
         <span className="font-semibold">{result.totalAmount?.toLocaleString('sv-SE')} kr</span>
        </div>
       </div>
      </div>
      
      <GloveFriendlyButton
       variant="primary"
       onClick={() => setShowMobileVerification(true)}
      >
       Verifiera och spara
      </GloveFriendlyButton>
     </div>
    )}
   </div>

   {/* Desktop: Original drag-and-drop UI */}
   <div className="hidden md:block">
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

    {error && (
     <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md mt-4">
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
     <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-blue-200 dark:border-blue-700 mt-4">
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
  </div>
 );
}

