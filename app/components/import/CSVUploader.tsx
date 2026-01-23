'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Loader2, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { detectDataType, ImportDataType } from '@/lib/import/bygglet-parser';
import Papa from 'papaparse';

interface CSVUploaderProps {
  onImportComplete?: (result: ImportResult) => void;
}

interface ImportResult {
  success: boolean;
  imported: number;
  total: number;
  errors: string[];
  warnings: string[];
}

interface PreviewData {
  headers: string[];
  rows: Record<string, string>[];
  dataType: ImportDataType | null;
  fileName: string;
  csvContent: string;
}

const DATA_TYPE_LABELS: Record<ImportDataType, string> = {
  projects: 'Projekt',
  time_entries: 'Tidrapporter',
  employees: 'Anställda',
  clients: 'Kunder',
  invoices: 'Fakturor',
};

export function CSVUploader({ onImportComplete }: CSVUploaderProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [selectedType, setSelectedType] = useState<ImportDataType | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      
      // Parse to get headers and preview rows
      const parsed = Papa.parse(content, {
        header: true,
        preview: 6, // Get 5 rows + header
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        toast.error('Kunde inte läsa CSV-filen', {
          description: parsed.errors[0]?.message,
        });
        return;
      }

      const headers = parsed.meta.fields || [];
      const detectedType = detectDataType(headers);

      setPreview({
        headers,
        rows: parsed.data as Record<string, string>[],
        dataType: detectedType,
        fileName: file.name,
        csvContent: content,
      });
      setSelectedType(detectedType);
      setResult(null);
    };

    reader.onerror = () => {
      toast.error('Kunde inte läsa filen');
    };

    reader.readAsText(file, 'UTF-8');
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleImport = async () => {
    if (!preview || !selectedType) {
      toast.error('Välj en datatyp först');
      return;
    }

    setIsImporting(true);
    setResult(null);

    try {
      const response = await fetch('/api/import/bygglet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          csvContent: preview.csvContent,
          dataType: selectedType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error('Importfel', { description: data.error });
        setResult({
          success: false,
          imported: 0,
          total: preview.rows.length,
          errors: data.errors || [data.error],
          warnings: data.warnings || [],
        });
        return;
      }

      setResult(data);
      
      if (data.success) {
        toast.success('Import klar!', {
          description: `${data.imported} av ${data.total} ${DATA_TYPE_LABELS[selectedType].toLowerCase()} importerades`,
        });
        onImportComplete?.(data);
      } else {
        toast.warning('Delvis import', {
          description: `${data.imported} av ${data.total} importerades. Se felmeddelanden nedan.`,
        });
      }
    } catch (error: any) {
      toast.error('Nätverksfel', { description: error.message });
      setResult({
        success: false,
        imported: 0,
        total: preview.rows.length,
        errors: [error.message],
        warnings: [],
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedType(null);
    setResult(null);
  };

  const downloadTemplate = (type: ImportDataType) => {
    const templates: Record<ImportDataType, string> = {
      projects: 'name,customer,budget_hours,hourly_rate,status,start_date\nExempelprojekt,Kund AB,100,450,active,2025-01-01',
      time_entries: 'date,employee,project,hours,type,description\n2025-01-15,Anna Andersson,Projekt X,8,work,Arbete på plats',
      employees: 'name,email,phone,hourly_rate,role\nAnna Andersson,anna@example.com,070-1234567,450,employee',
      clients: 'name,contact_person,email,phone,address,city,postal_code,org_number\nKund AB,Erik Eriksson,erik@kund.se,08-1234567,Storgatan 1,Stockholm,111 22,556123-4567',
      invoices: 'invoice_number,customer,amount,date,due_date,status,project\n2025-001,Kund AB,15000,2025-01-15,2025-02-15,sent,Projekt X',
    };

    const blob = new Blob([templates[type]], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mall_${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!preview && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
        >
          <input {...getInputProps()} />
          <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isDragActive ? 'Släpp filen här' : 'Dra och släpp en CSV-fil'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            eller klicka för att välja fil
          </p>
          <p className="text-xs text-gray-400">
            Stöder CSV från Bygglet och liknande system. Max 10 MB.
          </p>
        </div>
      )}

      {/* Template Downloads */}
      {!preview && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            📋 Ladda ner mallar
          </h3>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(DATA_TYPE_LABELS) as ImportDataType[]).map((type) => (
              <button
                key={type}
                onClick={() => downloadTemplate(type)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Download size={14} />
                {DATA_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary-500" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{preview.fileName}</p>
                <p className="text-sm text-gray-500">
                  {preview.rows.length} rader • {preview.headers.length} kolumner
                </p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Välj datatyp att importera
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(DATA_TYPE_LABELS) as ImportDataType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${selectedType === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-primary-300'
                    }
                    ${preview.dataType === type ? 'ring-2 ring-primary-300 ring-offset-1' : ''}
                  `}
                >
                  {DATA_TYPE_LABELS[type]}
                  {preview.dataType === type && (
                    <span className="ml-1 text-xs opacity-75">(detekterad)</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {preview.headers.slice(0, 6).map((header, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap"
                      >
                        {header}
                      </th>
                    ))}
                    {preview.headers.length > 6 && (
                      <th className="px-4 py-3 text-left font-medium text-gray-400">
                        +{preview.headers.length - 6} till
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      {preview.headers.slice(0, 6).map((header, j) => (
                        <td
                          key={j}
                          className="px-4 py-2 text-gray-900 dark:text-gray-100 whitespace-nowrap max-w-[200px] truncate"
                        >
                          {row[header] || '-'}
                        </td>
                      ))}
                      {preview.headers.length > 6 && (
                        <td className="px-4 py-2 text-gray-400">...</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 5 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500 text-center">
                Visar 5 av {preview.rows.length} rader
              </div>
            )}
          </div>

          {/* Import Button */}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={handleClear}
              disabled={isImporting}
            >
              Avbryt
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedType || isImporting}
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importerar...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Importera {selectedType ? DATA_TYPE_LABELS[selectedType] : ''}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className={`
          rounded-lg p-4 space-y-3
          ${result.success && result.errors.length === 0
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : result.imported > 0
            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }
        `}>
          <div className="flex items-center gap-2">
            {result.success && result.errors.length === 0 ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className={`w-5 h-5 ${result.imported > 0 ? 'text-yellow-600' : 'text-red-600'}`} />
            )}
            <span className="font-medium text-gray-900 dark:text-white">
              {result.imported} av {result.total} importerade
            </span>
          </div>

          {result.warnings.length > 0 && (
            <div className="text-sm text-yellow-700 dark:text-yellow-300">
              <p className="font-medium mb-1">Varningar:</p>
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.slice(0, 5).map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
                {result.warnings.length > 5 && (
                  <li>...och {result.warnings.length - 5} till</li>
                )}
              </ul>
            </div>
          )}

          {result.errors.length > 0 && (
            <div className="text-sm text-red-700 dark:text-red-300">
              <p className="font-medium mb-1">Fel:</p>
              <ul className="list-disc list-inside space-y-1">
                {result.errors.slice(0, 5).map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...och {result.errors.length - 5} fel till</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
