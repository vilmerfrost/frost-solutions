// app/components/ocr/FileUpload.tsx

'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  FileImage,
  Loader2,
  Upload as UploadIcon,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/lib/toast';
import type { DeliveryNoteOCRResult, InvoiceOCRResult } from '@/types/ocr';

/**
 * Props & Types
 */
type DocType = 'delivery-note' | 'invoice';

type APIResponse =
  | {
      success: true;
      correlationId: string;
      source: 'textract' | 'docai';
      lowConfidence: boolean;
      filePath: string;
      deliveryNoteId?: string;
      invoiceId?: string;
      requiresManualReview?: boolean;
      projectMatch?: {
        projectId: string;
        projectName: string;
        confidence: number;
        reason: string;
      } | null;
      data: DeliveryNoteOCRResult | InvoiceOCRResult;
    }
  | {
      success: false;
      error: string;
      correlationId?: string;
    };

export interface FileUploadProps {
  /** 'delivery-note' => /api/delivery-notes/process, 'invoice' => /api/supplier-invoices/process */
  docType: DocType;
  /** Valfri override av endpoint */
  endpoint?: string;
  /** Max filstorlek i MB (default 10) */
  maxSizeMB?: number;
  /** Tillåtna MIME-typer */
  accept?: string[];
  /** Idempotency key – lämna tomt så genereras en */
  idempotencyKey?: string;
  /** Called när OCR lyckas */
  onSuccess?: (payload: APIResponse & { success: true }) => void;
  /** Called på fel */
  onError?: (payload: APIResponse & { success: false }) => void;
  /** Extra metadata att skicka med i formData (ex. projectId) */
  extraFormData?: Record<string, string | number | boolean | null | undefined>;
}

/**
 * Validering (Zod)
 */
const ACCEPTED_TYPES_DEFAULT = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

const uploadSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, {
      message: 'Fil krävs',
    })
    .refine((f) => !!f, 'Fil krävs'),
});

/**
 * Hjälpare
 */
const isImageType = (mime: string) =>
  mime.startsWith('image/') && (mime.includes('jpeg') || mime.includes('png') || mime.includes('jpg'));

function readableFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function pickEndpoint(docType: DocType, override?: string) {
  if (override) return override;
  return docType === 'delivery-note'
    ? '/api/delivery-notes/process'
    : '/api/supplier-invoices/process';
}

/**
 * Komponent
 */
export default function FileUpload({
  docType,
  endpoint,
  maxSizeMB = 10,
  accept = ACCEPTED_TYPES_DEFAULT,
  idempotencyKey,
  onSuccess,
  onError,
  extraFormData,
}: FileUploadProps) {
  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof uploadSchema>>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { file: undefined as unknown as File },
    mode: 'onChange',
  });

  const file = watch('file');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<APIResponse & { success: true } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const computedEndpoint = useMemo(() => pickEndpoint(docType, endpoint), [docType, endpoint]);

  // Förhandsvisning
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Validera typ & storlek
  const validateSelectedFile = useCallback(
    (f: File | null) => {
      setErrorMsg(null);
      if (!f) {
        setErrorMsg('Ingen fil vald.');
        return false;
      }
      if (!accept.includes(f.type)) {
        setErrorMsg('Ogiltig filtyp. Endast PDF, JPEG eller PNG är tillåtna.');
        return false;
      }
      if (f.size > maxSizeMB * 1024 * 1024) {
        setErrorMsg(`Filen är för stor. Max ${maxSizeMB} MB (din: ${readableFileSize(f.size)}).`);
        return false;
      }
      return true;
    },
    [accept, maxSizeMB]
  );

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    if (validateSelectedFile(f)) {
      setValue('file', f as any, { shouldDirty: true, shouldValidate: true });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (validateSelectedFile(f)) {
      setValue('file', f as any, { shouldDirty: true, shouldValidate: true });
    } else {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const resetAll = () => {
    setErrorMsg(null);
    setServerError(null);
    setProgress(0);
    setUploading(false);
    setResult(null);
    reset();
    if (inputRef.current) inputRef.current.value = '';
  };

  /**
   * XHR-baserad upload för att få progress-event
   */
  const uploadWithProgress = useCallback(
    async (f: File): Promise<APIResponse> => {
      return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('file', f);

        if (extraFormData) {
          Object.entries(extraFormData).forEach(([k, v]) => {
            if (v === undefined || v === null) return;
            form.append(k, String(v));
          });
        }

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.open('POST', computedEndpoint, true);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Idempotency-Key', idempotencyKey || crypto.randomUUID());

        xhr.upload.onprogress = (evt) => {
          if (evt.lengthComputable) {
            const pct = Math.round((evt.loaded / evt.total) * 100);
            setProgress(pct);
          }
        };

        xhr.onreadystatechange = () => {
          if (xhr.readyState !== XMLHttpRequest.DONE) return;
          try {
            const contentType = xhr.getResponseHeader('content-type') || '';
            const isJson = contentType.includes('application/json');
            const body = isJson ? JSON.parse(xhr.responseText || '{}') : { success: false, error: 'Okänt svar' };

            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(body as APIResponse);
            } else {
              reject(body as APIResponse);
            }
          } catch (err) {
            reject({ success: false, error: 'Kunde inte tolka serversvar' } as APIResponse);
          }
        };

        xhr.onerror = () => {
          reject({ success: false, error: 'Nätverksfel vid uppladdning' } as APIResponse);
        };

        xhr.send(form);
      });
    },
    [computedEndpoint, idempotencyKey, extraFormData]
  );

  const onSubmit = async (values: z.infer<typeof uploadSchema>) => {
    setServerError(null);
    setResult(null);
    setUploading(true);
    setProgress(0);

    try {
      const resp = await uploadWithProgress(values.file);

      if (resp.success) {
        setResult(resp);
        const conf =
          'data' in resp && (resp.data as any)?.ocrConfidence != null
            ? (resp.data as any).ocrConfidence
            : undefined;

        toast.success(
          conf != null
            ? `OCR klar. Confidence ${conf}%`
            : `OCR klar.`
        );
        onSuccess?.(resp);
      } else {
        const msg = (resp as any).error || 'Okänt fel vid OCR';
        setServerError(msg);
        toast.error(msg);
        onError?.(resp as any);
      }
    } catch (err: any) {
      const msg = err?.error || err?.message || 'Uppladdningen misslyckades';
      setServerError(msg);
      toast.error(msg);
      onError?.(err as any);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = () => {
    setValue('file', undefined as any, { shouldDirty: true, shouldValidate: true });
    setPreviewUrl(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  /**
   * UI
   */
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UploadIcon className="h-5 w-5" />
          {docType === 'delivery-note' ? 'Ladda upp följesedel' : 'Ladda upp leverantörsfaktura'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Drop zone */}
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          aria-label="Släpp fil här för att ladda upp"
          className={cn(
            'group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition',
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
        >
          <div className="pointer-events-none absolute inset-0 rounded-2xl" />
          <div className="flex items-center gap-3">
            {file ? (
              isImageType(file.type) ? (
                <FileImage className="h-7 w-7 text-gray-500" />
              ) : (
                <FileText className="h-7 w-7 text-gray-500" />
              )
            ) : (
              <UploadIcon className="h-7 w-7 text-gray-500" />
            )}
            <div className="text-sm">
              <div className="font-medium">
                {file ? file.name : 'Dra & släpp en fil här, eller klicka för att välja'}
              </div>
              <div className="text-gray-500">
                Tillåtna format: PDF, JPEG, PNG • Max {maxSizeMB} MB
              </div>
            </div>
          </div>
          <Input
            ref={inputRef}
            id="file"
            name="file"
            type="file"
            accept={accept.join(',')}
            className="sr-only"
            onChange={handleFileChange}
          />
          <div className="mt-3">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              Välj fil
            </Button>
          </div>
        </div>

        {/* Preview & actions */}
        {file && (
          <div className="mt-4 flex items-start gap-4">
            <div className="w-24">
              {isImageType(file.type) && previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Förhandsvisning"
                  className="h-24 w-24 rounded-md object-cover ring-1 ring-gray-200"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-md bg-gray-100 ring-1 ring-gray-200">
                  <FileText className="h-10 w-10 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm">
                <div className="font-medium">{file.name}</div>
                <div className="text-gray-500">{file.type} • {readableFileSize(file.size)}</div>
              </div>
              {uploading ? (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Bearbetar/OCR pågår…
                  </div>
                  <Progress value={progress} aria-label="Uppladdningsprogress" />
                </div>
              ) : (
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeFile}
                    aria-label="Ta bort vald fil"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSubmit(onSubmit)}
                    disabled={!!errors.file || !!errorMsg || !file}
                  >
                    Starta OCR
                  </Button>
                  <Button variant="outline" onClick={resetAll}>Återställ</Button>
                </div>
              )}
              {(errors.file || errorMsg) && (
                <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                  <AlertTriangle className="h-4 w-4" />
                  {errors.file?.message || errorMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Server error */}
        {serverError && (
          <div className="mt-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <AlertTriangle className="h-4 w-4" />
            {serverError}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="mt-6 space-y-4 rounded-xl border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">OCR klart</span>
              </div>
              <div
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  result.lowConfidence ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                )}
              >
                Confidence:{' '}
                {'data' in result && (result.data as any)?.ocrConfidence != null
                  ? `${(result.data as any).ocrConfidence}%`
                  : '—'}
              </div>
            </div>

            {/* Sammanfattning */}
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase text-gray-500">Källa</div>
                <div className="text-sm">{result.source.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Correlation ID</div>
                <div className="text-sm break-all">{result.correlationId}</div>
              </div>
              {'data' in result && 'supplierName' in (result.data as any) && (
                <div className="md:col-span-2">
                  <div className="text-xs uppercase text-gray-500">Leverantör</div>
                  <div className="text-sm">{(result.data as any).supplierName}</div>
                </div>
              )}
            </div>

            {/* Project match för invoices */}
            {docType === 'invoice' && result.projectMatch && (
              <div className="rounded-md border p-3 bg-blue-50">
                <div className="text-xs uppercase text-gray-500 mb-1">Projektmatchning</div>
                <div className="text-sm font-medium">{result.projectMatch.projectName}</div>
                <div className="text-xs text-gray-600">Konfidens: {result.projectMatch.confidence}%</div>
              </div>
            )}

            {/* Raw text */}
            {'data' in result && (result.data as any)?.rawOCRText && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-500">Visa rå OCR-text</summary>
                <Textarea
                  readOnly
                  className="mt-2 h-40 text-xs"
                  value={(result.data as any).rawOCRText}
                />
              </details>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

