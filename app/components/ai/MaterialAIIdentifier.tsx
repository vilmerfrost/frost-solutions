'use client';

import { useState, useCallback } from 'react';
import { useAIMaterialIdentification } from '@/hooks/useAIMaterialIdentification';
import type { MaterialResult } from '@/types/ai';
import { useDropzone } from 'react-dropzone';
import { AICard } from './ui/AICard';
import { AIBadge } from './ui/AIBadge';
import { AILoadingSpinner } from './ui/AILoadingSpinner';
import { UploadCloud, ShoppingBag, Plus } from 'lucide-react';
import { toast } from '@/lib/toast';

// Funktion för att konvertera fil till base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

export function MaterialAIIdentifier() {
  const [result, setResult] = useState<MaterialResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const materialMutation = useAIMaterialIdentification();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      const base64Preview = URL.createObjectURL(file);
      setPreview(base64Preview);
      setResult(null); // Rensa gamla resultat

      const base64Data = await fileToBase64(file);
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Only = base64Data.split(',')[1] || base64Data;

      materialMutation.mutate(base64Only, {
        onSuccess: (data) => setResult(data),
        onError: (error: any) => {
          const message = error?.message || 'Kunde inte identifiera material';
          toast.error(message);
        },
      });
    },
    [materialMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png'] },
    maxFiles: 1,
  });

  return (
    <AICard>
      <AIBadge text="AI Materialidentifiering" />
      <div
        {...getRootProps()}
        className={`relative mt-4 p-6 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${materialMutation.isPending ? 'opacity-50' : ''}`}
      >
        <input {...getInputProps()} />

        {preview ? (
          <img src={preview} alt="Förhandsvisning" className="w-full h-48 object-contain rounded-lg" />
        ) : (
          <div className="flex flex-col items-center justify-center p-6">
            <UploadCloud className="w-12 h-12 text-gray-400" />
            <p className="mt-2 text-gray-600 dark:text-gray-400">Dra och släpp en bild, eller klicka.</p>
            <p className="text-xs text-gray-500">Identifiera material via foto.</p>
          </div>
        )}

        {materialMutation.isPending && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-gray-800/70 rounded-lg">
            <AILoadingSpinner text="Identifierar material..." />
          </div>
        )}

        {materialMutation.isError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400 text-sm text-center mb-2">
              {materialMutation.error?.message || 'Kunde inte identifiera material'}
            </p>
            <button
              onClick={() => {
                setPreview(null);
                setResult(null);
              }}
              className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Försök igen
            </button>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{result.category}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{result.name}</h3>
            </div>
            <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {result.confidence}%
            </span>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all"
              style={{ width: `${result.confidence}%` }}
            />
          </div>

          {result.supplierItems.length > 0 && (
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Matchande artiklar
              </h4>
              <ul className="mt-2 space-y-2">
                {result.supplierItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.supplier} | {item.price} kr
                      </p>
                    </div>
                    <button className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                      <Plus className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.alternatives.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Alternativa material</h4>
              <ul className="space-y-1">
                {result.alternatives.map((alt, idx) => (
                  <li key={idx} className="text-sm text-gray-600 dark:text-gray-400">
                    {alt.name} ({alt.confidence}% matchning)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AICard>
  );
}

