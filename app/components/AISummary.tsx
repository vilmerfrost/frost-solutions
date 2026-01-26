'use client';

import { useState } from 'react';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import { AICard } from './ai/ui/AICard';
import { AIBadge } from './ai/ui/AIBadge';
import { CachedBadge } from './ai/ui/CachedBadge';
import { AILoadingSpinner } from './ai/ui/AILoadingSpinner';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/http/fetcher';

interface AISummaryProps {
 type: 'project' | 'invoice' | 'time-reports' | 'admin-dashboard';
 data: any;
 className?: string;
}

export default function AISummary({ type, data, className = '' }: AISummaryProps) {
 const [summary, setSummary] = useState<string | null>(null);
 const [loading, setLoading] = useState(false);
 const [expanded, setExpanded] = useState(false);
 const [cached, setCached] = useState(false);
 const [error, setError] = useState<string | null>(null);

 async function generateSummary() {
  setLoading(true);
  setError(null);
  try {
   const result = await apiFetch<{ success?: boolean; error?: string; summary?: string; cached?: boolean }>('/api/ai/summarize', {
    method: 'POST',
    body: JSON.stringify({ 
     resourceType: type === 'time-reports' ? 'time-reports' : type === 'admin-dashboard' ? 'admin-dashboard' : type,
     resourceId: type === 'time-reports' || type === 'admin-dashboard' ? 'summary' : data?.id || 'summary',
     data: data || {}
    }),
   });

   if (!result.success) {
    throw new Error(result.error || 'Kunde inte generera sammanfattning');
   }

   setSummary(result.summary || 'Ingen sammanfattning kunde genereras.');
   setCached(result.cached || false);
   setExpanded(true);
  } catch (err: any) {
   const message = extractErrorMessage(err);
   setError(message);
   toast.error('Kunde inte generera sammanfattning: ' + message);
  } finally {
   setLoading(false);
  }
 }

 if (error && !summary) {
  return (
   <AICard variant="red" className={className}>
    <div className="flex flex-col items-center text-center">
     <AlertCircle className="w-8 h-8 text-red-500" />
     <h3 className="mt-2 font-semibold text-red-700 dark:text-red-200">Sammanfattning misslyckades</h3>
     <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
     <button
      onClick={generateSummary}
      disabled={loading}
      className="mt-4 px-3 py-1.5 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
     >
      <RefreshCw className="w-4 h-4" />
      Försök igen
     </button>
    </div>
   </AICard>
  );
 }

 if (!summary && !loading) {
  return (
   <AICard className={className}>
    <div className="flex items-center justify-between mb-3">
     <AIBadge text="AI-sammanfattning" />
     <button
      onClick={generateSummary}
      disabled={loading}
      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-semibold hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
     >
      {loading ? 'Genererar...' : 'Generera'}
     </button>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400">
     Klicka på &quot;Generera&quot; för att få en AI-genererad sammanfattning av{' '}
     {type === 'project' ? 'projektet' : 'fakturan'}.
    </p>
   </AICard>
  );
 }

 return (
  <AICard className={className}>
   <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
     <AIBadge text="AI-sammanfattning" />
     {cached && <CachedBadge />}
    </div>
    <button
     onClick={() => setExpanded(!expanded)}
     className="px-3 py-1 text-sm text-primary-500 dark:text-primary-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
    >
     {expanded ? 'Dölj' : 'Visa'}
    </button>
   </div>

   {loading ? (
    <AILoadingSpinner text="Genererar sammanfattning..." />
   ) : (
    summary &&
    expanded && (
     <div className="prose prose-sm max-w-none dark:prose-invert">
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{summary}</p>
     </div>
    )
   )}

   {summary && (
    <button
     onClick={generateSummary}
     disabled={loading}
     className="mt-3 text-sm text-primary-500 dark:text-primary-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
     {loading ? 'Genererar om...' : 'Generera om'}
    </button>
   )}
  </AICard>
 );
}
