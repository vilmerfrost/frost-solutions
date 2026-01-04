'use client';

import { useEffect } from 'react';
import { useProjectAnalytics } from '@/hooks/useProjectAnalytics';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface ProjectAnalyticsProps {
 projectId: string;
}

/**
 * Statuskort för att visa om projektet är på schema, budget, etc.
 */
function StatusCard({
 title,
 status,
 value,
}: {
 title: string;
 status: boolean;
 value: string;
}) {
 return (
  <div
   className={`p-4 rounded-[8px] border-2 ${
    status
     ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
     : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
   }`}
  >
   <div className="flex items-center justify-between mb-2">
    <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
    {status ? (
     <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
    ) : (
     <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
    )}
   </div>
   <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
  </div>
 );
}

/**
 * Komponent för att visa enskilda metrics
 */
function MetricItem({ label, value }: { label: string; value: string | number }) {
 return (
  <div>
   <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
   <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{value}</p>
  </div>
 );
}

/**
 * Huvudkomponent för att visa analytics för ett enskilt projekt
 */
export function ProjectAnalytics({ projectId }: ProjectAnalyticsProps) {
 const { data: analytics, isLoading, error, refetch } = useProjectAnalytics(projectId);
 const queryClient = useQueryClient();

 // Listen for data updates and refetch analytics
 useEffect(() => {
  const handleTimeEntryUpdate = (event: Event) => {
   const customEvent = event as CustomEvent;
   const eventProjectId = customEvent.detail?.projectId;
   
   // Only refetch if this event is for this project
   if (!eventProjectId || eventProjectId === projectId) {
    console.log('🔄 ProjectAnalytics: Time entry updated, refetching...');
    queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
    setTimeout(() => refetch(), 500);
   }
  };

  const handleProjectUpdate = (event: Event) => {
   const customEvent = event as CustomEvent;
   const eventProjectId = customEvent.detail?.projectId;
   
   if (!eventProjectId || eventProjectId === projectId) {
    console.log('🔄 ProjectAnalytics: Project updated, refetching...');
    queryClient.invalidateQueries({ queryKey: ['project-analytics', projectId] });
    setTimeout(() => refetch(), 500);
   }
  };

  window.addEventListener('timeEntryUpdated', handleTimeEntryUpdate);
  window.addEventListener('projectUpdated', handleProjectUpdate);

  return () => {
   window.removeEventListener('timeEntryUpdated', handleTimeEntryUpdate);
   window.removeEventListener('projectUpdated', handleProjectUpdate);
  };
 }, [projectId, queryClient, refetch]);

 if (isLoading) {
  return (
   <div className="flex items-center justify-center p-8">
    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
   </div>
  );
 }

 if (error || !analytics) {
  return (
   <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-[8px] border border-red-200 dark:border-red-800">
    <p className="text-red-600 dark:text-red-400">
     Kunde inte ladda projektanalys: {error?.message || 'Okänt fel'}
    </p>
   </div>
  );
 }

 return (
  <div className="space-y-6">
   {/* Status Indicators */}
   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <StatusCard
     title="Schema"
     status={analytics.status.onSchedule}
     value={`SPI: ${analytics.kpis.spi.toFixed(2)}`}
    />
    <StatusCard
     title="Budget"
     status={analytics.status.onBudget}
     value={`${analytics.kpis.budgetVariance > 0 ? '+' : ''}${analytics.kpis.budgetVariance.toFixed(1)}%`}
    />
    <StatusCard
     title="Lönsamhet"
     status={analytics.status.profitable}
     value={`${analytics.kpis.profitability.toFixed(1)}%`}
    />
   </div>

   {/* Metrics */}
   <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-200 dark:border-gray-700">
    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
     Mätvärden
    </h3>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
     <MetricItem label="Faktiska timmar" value={analytics.metrics.actualHours.toFixed(1)} />
     <MetricItem label="Planerade timmar" value={analytics.metrics.plannedHours.toFixed(1)} />
     <MetricItem
      label="Faktisk kostnad"
      value={`${analytics.metrics.actualCost.toLocaleString('sv-SE')} kr`}
     />
     <MetricItem
      label="Planerat värde"
      value={`${analytics.metrics.plannedValue.toLocaleString('sv-SE')} kr`}
     />
     <MetricItem
      label="Intäkter"
      value={`${analytics.metrics.revenue.toLocaleString('sv-SE')} kr`}
     />
    </div>
   </div>

   {/* KPIs */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-200 dark:border-gray-700">
     <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Schemaprestanda (SPI)</h4>
     <p className="text-3xl font-bold text-gray-900 dark:text-white">
      {analytics.kpis.spi.toFixed(2)}
     </p>
     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      {analytics.kpis.spi >= 0.95 ? 'På schema' : 'Försenad'}
     </p>
    </div>
    <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6 border border-gray-200 dark:border-gray-700">
     <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Kostnadsprestanda (CPI)</h4>
     <p className="text-3xl font-bold text-gray-900 dark:text-white">
      {analytics.kpis.cpi.toFixed(2)}
     </p>
     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
      {analytics.kpis.cpi >= 0.95 ? 'På budget' : 'Över budget'}
     </p>
    </div>
   </div>
  </div>
 );
}

