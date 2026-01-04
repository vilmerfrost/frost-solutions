// app/components/ui/accessible-file-upload.tsx

/**
 * Accessible File Upload Component
 * Based on Claude implementation with WCAG 2.1 AA compliance
 */

'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, File, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatFileSize(bytes: number): string {
 const units = ['B', 'KB', 'MB', 'GB'];
 let size = bytes;
 let unitIndex = 0;
 while (size >= 1024 && unitIndex < units.length - 1) {
  size /= 1024;
  unitIndex++;
 }
 return `${size.toFixed(1)} ${units[unitIndex]}`;
}

interface AccessibleFileUploadProps {
 accept?: string;
 maxSize?: number; // in bytes
 multiple?: boolean;
 onFilesSelected: (files: File[]) => void;
 disabled?: boolean;
 error?: string;
 helperText?: string;
}

export function AccessibleFileUpload({
 accept = '.pdf,.jpg,.jpeg,.png',
 maxSize = 10 * 1024 * 1024, // 10MB default
 multiple = false,
 onFilesSelected,
 disabled = false,
 error,
 helperText,
}: AccessibleFileUploadProps) {
 const inputRef = useRef<HTMLInputElement>(null);
 const [isDragging, setIsDragging] = useState(false);
 const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

 const handleFileChange = (files: FileList | null) => {
  if (!files) return;
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const errors: string[] = [];

  fileArray.forEach((file) => {
   // Validate file size
   if (file.size > maxSize) {
    errors.push(`Filen ${file.name} är för stor. Max ${formatFileSize(maxSize)}.`);
    return;
   }

   // Validate file type
   const acceptedTypes = accept.split(',').map((t) => t.trim());
   const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

   if (!acceptedTypes.includes(fileExtension)) {
    errors.push(`Filen ${file.name} har ogiltigt format. Tillåtna: ${accept}`);
    return;
   }

   validFiles.push(file);
  });

  if (errors.length > 0) {
   console.error('File validation errors:', errors);
   return;
  }

  setSelectedFiles(validFiles);
  onFilesSelected(validFiles);
 };

 const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  setIsDragging(false);
  if (disabled) return;
  handleFileChange(e.dataTransfer.files);
 };

 const handleDragOver = (e: React.DragEvent) => {
  e.preventDefault();
  if (!disabled) {
   setIsDragging(true);
  }
 };

 const handleDragLeave = () => {
  setIsDragging(false);
 };

 const handleClick = () => {
  if (!disabled) {
   inputRef.current?.click();
  }
 };

 const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
   e.preventDefault();
   handleClick();
  }
 };

 const removeFile = (index: number) => {
  const newFiles = selectedFiles.filter((_, i) => i !== index);
  setSelectedFiles(newFiles);
  onFilesSelected(newFiles);
 };

 return (
  <div className="w-full space-y-3">
   {/* Upload Area */}
   <div
    role="button"
    tabIndex={disabled ? -1 : 0}
    aria-label="Ladda upp fil"
    aria-disabled={disabled}
    onClick={handleClick}
    onKeyDown={handleKeyDown}
    onDrop={handleDrop}
    onDragOver={handleDragOver}
    onDragLeave={handleDragLeave}
    className={cn(
     'relative border-2 border-dashed rounded-[8px] p-8 text-center cursor-pointer',
     'transition-all duration-200',
     'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
     isDragging && 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
     !isDragging && 'border-gray-300 hover:border-gray-400 dark:border-gray-700',
     disabled && 'opacity-50 cursor-not-allowed',
     error && 'border-red-500'
    )}
   >
    <input
     ref={inputRef}
     type="file"
     accept={accept}
     multiple={multiple}
     onChange={(e) => handleFileChange(e.target.files)}
     disabled={disabled}
     className="sr-only"
     aria-hidden="true"
    />
    <div className="flex flex-col items-center gap-3">
     <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
      <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
     </div>
     <div>
      <p className="text-base font-medium text-gray-900 dark:text-white">
       Dra och släpp fil här
      </p>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
       eller klicka för att välja fil
      </p>
     </div>
     {helperText && (
      <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
     )}
     <p className="text-xs text-gray-500 dark:text-gray-400">
      Tillåtna format: {accept} · Max {formatFileSize(maxSize)}
     </p>
    </div>
   </div>

   {/* Error Message */}
   {error && (
    <div
     role="alert"
     aria-live="polite"
     className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
    >
     <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
     <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
    </div>
   )}

   {/* Selected Files */}
   {selectedFiles.length > 0 && (
    <div className="space-y-2" role="list" aria-label="Valda filer">
     {selectedFiles.map((file, index) => (
      <div
       key={index}
       role="listitem"
       className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
       <div className="flex items-center gap-3 flex-1 min-w-0">
        <File className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
         <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {file.name}
         </p>
         <p className="text-xs text-gray-600 dark:text-gray-400">
          {formatFileSize(file.size)}
         </p>
        </div>
       </div>
       <button
        type="button"
        onClick={() => removeFile(index)}
        aria-label={`Ta bort ${file.name}`}
        className="p-1 text-gray-500 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
       >
        <X className="w-5 h-5" />
       </button>
      </div>
     ))}
    </div>
   )}
  </div>
 );
}

