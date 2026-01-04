'use client';

import { useState } from 'react';
import { useAIBudgetPrediction } from '@/hooks/useAIBudgetPrediction';
import type { BudgetPrediction } from '@/types/ai';
import { AICard } from './ui/AICard';
import { AIBadge } from './ui/AIBadge';
import { AILoadingSpinner } from './ui/AILoadingSpinner';
import { AIActionButton } from './ui/AIActionButton';
import { Zap, ListChecks } from 'lucide-react';
import { toast } from '@/lib/toast';

const riskVariants: Record<string, 'green' | 'yellow' | 'red'> = {
 low: 'green',
 medium: 'yellow',
 high: 'red',
};

export function BudgetAIPrediction({ projectId }: { projectId: string }) {
 const [prediction, setPrediction] = useState<BudgetPrediction | null>(null);
 const budgetMutation = useAIBudgetPrediction();

 const handlePredict = () => {
  budgetMutation.mutate(projectId, {
   onSuccess: (data) => setPrediction(data),
   onError: (error: any) => {
    const message = error?.message || 'Kunde inte generera budgetprognos';
    toast.error(message);
   },
  });
 };

 const riskVariant = prediction ? riskVariants[prediction.riskLevel] : 'default';

 return (
  <AICard variant={riskVariant}>
   <div className="flex justify-between items-start">
    <AIBadge text="AI Budgetprognos" />
    {prediction && (
     <span
      className={`px-3 py-1 rounded-full text-xs font-medium ${
       riskVariant === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : ''
      } ${
       riskVariant === 'yellow'
        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200'
        : ''
      } ${riskVariant === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' : ''}`}
     >
      Risk: {prediction.riskLevel}
     </span>
    )}
   </div>

   {budgetMutation.isPending && <AILoadingSpinner text="Kör prognos..." />}

   {budgetMutation.isError && (
    <div className="text-center py-6">
     <p className="text-red-600 dark:text-red-400 mb-4">
      {budgetMutation.error?.message || 'Kunde inte generera budgetprognos'}
     </p>
     <AIActionButton onClick={handlePredict} icon={Zap}>
      Försök igen
     </AIActionButton>
    </div>
   )}

   {!prediction && !budgetMutation.isPending && !budgetMutation.isError && (
    <div className="text-center py-6">
     <p className="text-gray-600 dark:text-gray-400 mb-4">
      Få en AI-baserad prognos över projektets budget.
     </p>
     <AIActionButton onClick={handlePredict} icon={Zap}>
      Kör prognos
     </AIActionButton>
    </div>
   )}

   {prediction && (
    <div className="mt-4 space-y-4">
     <div className="text-center">
      <p className="text-sm text-gray-500 dark:text-gray-400">Predikterad slutkostnad</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">
       {prediction.predictedFinal.toLocaleString('sv-SE')} kr
      </p>
      <span className="text-xs text-gray-500">(Konfidens: {prediction.confidence})</span>
     </div>

     {/* Progress Bar */}
     <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
      <div
       className={`h-4 rounded-full transition-all duration-1000 ${
        riskVariant === 'green' ? 'bg-green-500' : ''
       } ${riskVariant === 'yellow' ? 'bg-amber-500' : ''} ${riskVariant === 'red' ? 'bg-red-500' : ''}`}
       style={{ width: `${prediction.currentProgress}%` }}
       aria-valuenow={prediction.currentProgress}
       aria-valuemin={0}
       aria-valuemax={100}
      />
     </div>

     <div className="grid grid-cols-2 gap-4 text-sm">
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
       <p className="text-gray-500 dark:text-gray-400">Nuvarande kostnad</p>
       <p className="font-semibold">{prediction.currentSpend.toLocaleString('sv-SE')} kr</p>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
       <p className="text-gray-500 dark:text-gray-400">Budget kvar</p>
       <p className="font-semibold">{prediction.budgetRemaining.toLocaleString('sv-SE')} kr</p>
      </div>
     </div>

     {prediction.suggestions.length > 0 && (
      <div>
       <h4 className="font-semibold flex items-center gap-2">
        <ListChecks className="w-4 h-4" /> Föreslagna åtgärder
       </h4>
       <ul className="list-disc list-inside mt-2 text-sm text-gray-700 dark:text-gray-300 space-y-1">
        {prediction.suggestions.map((suggestion, i) => (
         <li key={i}>{suggestion}</li>
        ))}
       </ul>
      </div>
     )}
    </div>
   )}
  </AICard>
 );
}

