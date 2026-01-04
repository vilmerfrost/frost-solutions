'use client';

import { useState } from 'react';
import { useAIProjectPlan } from '@/hooks/useAIProjectPlan';
import { AICard } from './ui/AICard';
import { AIBadge } from './ui/AIBadge';
import { AILoadingSpinner } from './ui/AILoadingSpinner';
import { AIActionButton } from './ui/AIActionButton';
import { CachedBadge } from './ui/CachedBadge';
import { Check, Edit, Zap, AlertTriangle, CalendarDays } from 'lucide-react';
import { toast } from '@/lib/toast';

export function ProjectAIPlanning({ projectId }: { projectId: string }) {
 const [response, setResponse] = useState<{ plan: any; cached: boolean } | null>(null);
 const planMutation = useAIProjectPlan();

 const handleGenerate = () => {
  planMutation.mutate(projectId, {
   onSuccess: (data) => {
    setResponse({ plan: data.plan, cached: data.cached });
   },
   onError: (error: any) => {
    const message = error?.message || 'Kunde inte generera projektplan';
    toast.error(message);
   },
  });
 };

 const handleUsePlan = () => {
  toast.success('Projektplanen har applicerats!');
  // TODO: Logic to populate project form...
 };

 return (
  <AICard>
   <div className="flex justify-between items-start">
    <AIBadge text="AI Projektplan" />
    {response?.cached && <CachedBadge />}
   </div>

   {planMutation.isPending && <AILoadingSpinner text="Genererar tidsplan..." />}

   {planMutation.isError && (
    <div className="text-center py-6">
     <p className="text-red-600 dark:text-red-400 mb-4">
      {planMutation.error?.message || 'Kunde inte generera projektplan'}
     </p>
     <AIActionButton onClick={handleGenerate} icon={Zap}>
      Försök igen
     </AIActionButton>
    </div>
   )}

   {!response && !planMutation.isPending && !planMutation.isError && (
    <div className="text-center py-6">
     <p className="text-gray-600 dark:text-gray-400 mb-4">
      Låt AI skapa ett utkast till en tidsplan och resursallokering.
     </p>
     <AIActionButton onClick={handleGenerate} icon={Zap}>
      Generera plan
     </AIActionButton>
    </div>
   )}

   {response?.plan && (
    <div className="mt-4 space-y-4">
     {/* Översikt */}
     <div className="grid grid-cols-2 gap-4 text-center">
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
       <p className="text-xs text-gray-500 dark:text-gray-400">Total tid</p>
       <p className="text-lg font-bold">{response.plan.totalDays} dagar</p>
      </div>
      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
       <p className="text-xs text-gray-500 dark:text-gray-400">Rek. Team</p>
       <p className="text-lg font-bold">{response.plan.recommendedTeamSize} pers</p>
      </div>
     </div>

     {/* Gantt-style (enkel) */}
     <div>
      <h4 className="font-semibold flex items-center gap-2">
       <CalendarDays className="w-4 h-4" /> Föreslagna faser
      </h4>
      <div className="mt-2 space-y-3">
       {response.plan.phases.map((phase: any, i: number) => (
        <div key={i}>
         <div className="flex justify-between text-sm mb-1">
          <span className="font-medium">{phase.name}</span>
          <span className="text-gray-500">{phase.duration} dagar</span>
         </div>
         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
          <div
           className="bg-primary-500 h-2.5 rounded-full transition-all"
           style={{ width: `${(phase.duration / response.plan.totalDays) * 100}%` }}
          />
         </div>
         {phase.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{phase.description}</p>
         )}
        </div>
       ))}
      </div>
     </div>

     {/* Riskfaktorer */}
     {response.plan.riskFactors.length > 0 && (
      <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
       <h4 className="font-semibold flex items-center gap-2 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="w-4 h-4" /> Riskfaktorer
       </h4>
       <ul className="list-disc list-inside mt-2 text-sm text-amber-700 dark:text-amber-300 space-y-1">
        {response.plan.riskFactors.map((risk: string, i: number) => (
         <li key={i}>{risk}</li>
        ))}
       </ul>
      </div>
     )}

     {/* Åtgärder */}
     <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
      <AIActionButton onClick={handleUsePlan} icon={Check}>
       Använd plan
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

