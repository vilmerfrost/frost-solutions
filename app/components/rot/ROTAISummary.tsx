// app/components/rot/ROTAISummary.tsx
// ✅ AI-powered ROT summary component
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ROTData {
 projectName?: string;
 propertyAddress?: string;
 workType?: string;
 personalNumber?: string;
 employees?: number;
 activeProjects?: number;
 totalCost?: number;
 laborCost?: number;
 materialCost?: number;
 customerName?: string;
 projectDescription?: string;
 workPeriod?: string;
 totalAmount?: number;
 vatAmount?: number;
 rotAmount?: number;
 rutAmount?: number;
}

interface ROTAISummaryProps {
 rotData: ROTData;
 onSummaryGenerated?: (summary: string) => void;
 className?: string;
}

export function ROTAISummary({ rotData, onSummaryGenerated, className = '' }: ROTAISummaryProps) {
 const [loading, setLoading] = useState(false);
 const [summary, setSummary] = useState<string | null>(null);
 const [keyPoints, setKeyPoints] = useState<string[]>([]);
 const [error, setError] = useState<string | null>(null);

 const handleGenerate = async () => {
  setLoading(true);
  setError(null);
  setSummary(null);

  try {
   // Prepare data for API
   const apiData = {
    customerName: rotData.customerName || rotData.projectName || 'Kund',
    projectDescription: rotData.projectDescription || 
     `${rotData.workType || 'Renovering'} på ${rotData.propertyAddress || 'fastighet'}`,
    workPeriod: rotData.workPeriod || 'Pågående',
    totalAmount: rotData.totalAmount || rotData.totalCost || 0,
    vatAmount: rotData.vatAmount || Math.round((rotData.totalAmount || rotData.totalCost || 0) * 0.25),
    rotAmount: rotData.rotAmount,
    rutAmount: rotData.rutAmount,
   };

   const response = await fetch('/api/ai/rot-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(apiData),
   });

   const data = await response.json();

   if (!data.success) {
    throw new Error(data.error || 'Failed to generate summary');
   }

   const generatedSummary = data.data.summary;
   const keyPoints = data.data.keyPoints || [];
   setSummary(generatedSummary);
   
   if (onSummaryGenerated) {
    onSummaryGenerated(generatedSummary);
   }
   
   // Store keyPoints for display
   setKeyPoints(keyPoints);
  } catch (err) {
   const errorMessage = err instanceof Error ? err.message : 'Unknown error';
   setError(errorMessage);
   console.error('[ROTAISummary] Error:', err);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className={`space-y-4 ${className}`}>
   <div className="flex items-center justify-between">
    <div>
     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
      AI-genererad sammanfattning
     </h3>
     <p className="text-sm text-gray-600 dark:text-gray-400">
      Generera en professionell sammanfattning för ROT-ansökan
     </p>
    </div>
    <Button
     onClick={handleGenerate}
     disabled={loading}
     className="bg-primary-500 hover:bg-primary-600 hover:"
    >
     {loading ? (
      <>
       <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
       Genererar...
      </>
     ) : (
      <>
       <svg
        className="mr-2 h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
       >
        <path
         strokeLinecap="round"
         strokeLinejoin="round"
         strokeWidth={2}
         d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
        />
       </svg>
       Generera sammanfattning
      </>
     )}
    </Button>
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

   {summary && (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-green-200 dark:border-green-700">
     <div className="flex items-center gap-3 mb-4">
      <svg
       className="h-5 w-5 text-green-600 dark:text-green-400"
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
      <h4 className="font-semibold text-gray-900 dark:text-white">
       Genererad sammanfattning
      </h4>
     </div>
     <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
       {summary}
      </p>
     </div>
     {keyPoints && keyPoints.length > 0 && (
      <div className="mt-4 pt-4 border-t border-green-200 dark:border-green-700">
       <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
        Viktiga punkter:
       </h5>
       <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
        {keyPoints.map((point: string, idx: number) => (
         <li key={idx}>{point}</li>
        ))}
       </ul>
      </div>
     )}
    </div>
   )}
  </div>
 );
}

