'use client'

import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, X } from 'lucide-react'
import { isSupportedAtaPhotoFile } from '@/lib/ata/photoUploads'
import { toast } from '@/lib/toast'

interface AtaPhotoPickerProps {
  files: File[]
  onChange: (files: File[]) => void
  required?: boolean
  showRequiredWarning?: boolean
  disabled?: boolean
}

export function AtaPhotoPicker({
  files,
  onChange,
  required = false,
  showRequiredWarning = false,
  disabled = false,
}: AtaPhotoPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [files])

  function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files || [])
    if (selectedFiles.length === 0) return

    const validFiles = selectedFiles.filter(isSupportedAtaPhotoFile)

    if (validFiles.length !== selectedFiles.length) {
      toast.error('Vissa filer var ogiltiga (endast bilder, max 10MB)')
    }

    if (validFiles.length > 0) {
      onChange([...files, ...validFiles])
    }

    event.target.value = ''
  }

  function removePhoto(index: number) {
    onChange(files.filter((_, fileIndex) => fileIndex !== index))
  }

  return (
    <div className="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-700 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Camera className="w-4 h-4 text-stone-500 dark:text-stone-400" />
        <label className="text-sm font-semibold text-stone-700 dark:text-stone-300">
          Foton {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      <p className="text-xs text-stone-500 dark:text-stone-400 mb-3">
        Ta bilder direkt i mobilens webbläsare eller välj befintliga foton från telefonen.
      </p>

      {showRequiredWarning && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
          Vid oförutsett arbete måste du bifoga minst ett foto som bevis innan du skickar in ÄTA:n.
        </div>
      )}

      {previewUrls.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {previewUrls.map((url, index) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-700">
              <img src={url} alt={`Foto ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                disabled={disabled}
                aria-label={`Ta bort foto ${index + 1}`}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFilesSelected}
        data-testid="ata-camera-input"
        className="hidden"
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelected}
        data-testid="ata-gallery-input"
        className="hidden"
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-stone-900 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
          <span>Ta foto</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ImagePlus className="h-4 w-4" />
          <span>Välj från telefon</span>
        </button>
      </div>
    </div>
  )
}
