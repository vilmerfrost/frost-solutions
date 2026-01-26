// app/components/rot/AIRotSummaryButton.tsx
// ✅ Drop-in AI summary component for ROT pages
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/http/fetcher';

interface AIRotSummaryButtonProps {
 rotApplicationId: string;
 customerName: string;
 projectDescription: string;
 workPeriod: string;
 totalAmount: number;
 vatAmount: number;
 rotAmount?: number;
 rutAmount?: number;
 onSummaryGenerated?: (summary: string) => void;
}

export function AIRotSummaryButton({
 rotApplicationId,
 customerName,
 projectDescription,
 workPeriod,
 totalAmount,
 vatAmount,
 rotAmount,
 rutAmount,
 onSummaryGenerated,
}: AIRotSummaryButtonProps) {
 const [loading, setLoading] = useState(false);
 const [summary, setSummary] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);

 const handleGenerate = async () => {
  setLoading(true);
  setError(null);
  setSummary(null);

  try {
   const data = await apiFetch<{ success?: boolean; error?: string; data?: { summary: string } }>('/api/ai/rot-rut-summary', {
    method: 'POST',
    body: JSON.stringify({
     customerName,
     projectDescription,
     workPeriod,
     totalAmount,
     vatAmount,
     rotAmount,
     rutAmount,
    }),
   });

  if (!data.success || !data.data) {
   throw new Error(data.error || 'Failed to generate summary');
  }

  const generatedSummary = data.data.summary;
   setSummary(generatedSummary);
   
   if (onSummaryGenerated) {
    onSummaryGenerated(generatedSummary);
   }
  } catch (err) {
   const errorMessage = err instanceof Error ? err.message : 'Unknown error';
   setError(errorMessage);
   console.error('[AIRotSummaryButton] Error:', err);
  } finally {
   setLoading(false);
  }
 };

 return (
  <div className="space-y-4">
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
      Genererar sammanfattning...
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
      Generera AI-sammanfattning
     </>
    )}
   </Button>

   {error && (
    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
     <p className="text-sm text-red-700">{error}</p>
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
      <h3 className="font-semibold text-gray-900 dark:text-white">
       AI-genererad sammanfattning
      </h3>
     </div>
     <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
       {summary}
      </p>
     </div>
    </div>
   )}
  </div>
 );
}

