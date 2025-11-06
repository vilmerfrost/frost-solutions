'use client';

import { useState } from 'react';
import { useAIInvoiceSuggestion } from '@/hooks/useAIInvoiceSuggestion';
import { AICard } from './ui/AICard';
import { AIBadge } from './ui/AIBadge';
import { AILoadingSpinner } from './ui/AILoadingSpinner';
import { AIActionButton } from './ui/AIActionButton';
import { CachedBadge } from './ui/CachedBadge';
import { Check, Edit, Zap, Percent } from 'lucide-react';
import { toast } from '@/lib/toast';

interface InvoiceAISuggestionProps {
  projectId: string;
  onUseSuggestion?: (suggestion: any) => void;
}

export function InvoiceAISuggestion({ projectId, onUseSuggestion }: InvoiceAISuggestionProps) {
  const [response, setResponse] = useState<{ suggestion: any; cached: boolean } | null>(null);
  const invoiceMutation = useAIInvoiceSuggestion();

  const handleGenerate = () => {
    invoiceMutation.mutate(projectId, {
      onSuccess: (data) => {
        setResponse({ suggestion: data.suggestion, cached: data.cached });
      },
      onError: (error: any) => {
        const message = error?.message || 'Kunde inte generera fakturaförslag';
        toast.error(message);
      },
    });
  };

  const handleUseSuggestion = () => {
    if (response?.suggestion && onUseSuggestion) {
      onUseSuggestion(response.suggestion);
      toast.success('Fakturan har auto-ifyllts!');
    } else {
      toast.error('Inget förslag att använda');
    }
  };

  return (
    <AICard>
      <div className="flex justify-between items-start">
        <AIBadge text="AI Fakturaunderlag" />
        {response?.cached && <CachedBadge />}
      </div>

      {invoiceMutation.isPending && <AILoadingSpinner text="Genererar fakturaförslag..." />}

      {invoiceMutation.isError && (
        <div className="text-center py-6">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {invoiceMutation.error?.message || 'Kunde inte generera fakturaförslag'}
          </p>
          <AIActionButton onClick={handleGenerate} icon={Zap}>
            Försök igen
          </AIActionButton>
        </div>
      )}

      {!response && !invoiceMutation.isPending && !invoiceMutation.isError && (
        <div className="text-center py-6">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Spara tid genom att låta AI föreslå fakturarader.
          </p>
          <AIActionButton onClick={handleGenerate} icon={Zap}>
            Generera förslag
          </AIActionButton>
        </div>
      )}

      {response?.suggestion && (
        <div className="mt-4 space-y-4">
          {/* Header */}
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Totalt att fakturera (exkl. moms)
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {response.suggestion.totalAmount.toLocaleString('sv-SE')} kr
            </span>
          </div>

          {/* Rader */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Föreslagna rader</h4>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {response.suggestion.invoiceRows.map((row: any, i: number) => (
                <li key={i} className="py-2 grid grid-cols-3 gap-2 text-sm">
                  <span className="col-span-2 font-medium">{row.description}</span>
                  <span className="text-right">{row.amount.toLocaleString('sv-SE')} kr</span>
                </li>
              ))}
            </ul>
          </div>

          {response.suggestion.suggestedDiscount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
              <Percent className="w-4 h-4" />
              <span className="text-sm font-medium">
                AI föreslår en rabatt på {response.suggestion.suggestedDiscount}%.
              </span>
            </div>
          )}

          {response.suggestion.notes && (
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm">
              {response.suggestion.notes}
            </div>
          )}

          {/* Åtgärder */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <AIActionButton onClick={handleUseSuggestion} icon={Check}>
              Använd förslag
            </AIActionButton>
            <AIActionButton variant="secondary" icon={Edit}>
              Redigera
            </AIActionButton>
          </div>
        </div>
      )}
    </AICard>
  );
}

