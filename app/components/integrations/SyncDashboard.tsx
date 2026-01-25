// app/components/integrations/SyncDashboard.tsx
"use client";

import { useState } from 'react';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import type { SyncJob } from '@/types/integrations';

type JobStatus = SyncJob['status'];

const statusConfig = {
  queued: { icon: Clock, text: 'Köad', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  running: { icon: Loader2, text: 'Körs', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900' },
  success: { icon: CheckCircle, text: 'Slutförd', color: 'text-green-500 bg-green-100 dark:bg-green-900' },
  failed: { icon: XCircle, text: 'Misslyckad', color: 'text-red-500 bg-red-100 dark:bg-red-900' },
  retry: { icon: RefreshCw, text: 'Försöker igen', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900' },
  pending: { icon: Clock, text: 'Väntar', color: 'text-gray-500 bg-gray-100 dark:bg-gray-700' },
  processing: { icon: Loader2, text: 'Bearbetar', color: 'text-blue-500 bg-blue-100 dark:bg-blue-900' },
  completed: { icon: CheckCircle, text: 'Klar', color: 'text-green-500 bg-green-100 dark:bg-green-900' },
  requires_manual_resolution: { icon: XCircle, text: 'Manuell åtgärd', color: 'text-amber-500 bg-amber-100 dark:bg-amber-900' },
};

const JobStatusBadge = ({ status }: { status: JobStatus }) => {
 const config = statusConfig[status] || statusConfig.pending;
 const Icon = config.icon;
 return (
  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${config.color}`}>
   <Icon className={`w-3.5 h-3.5 ${status === 'processing' ? 'animate-spin' : ''}`} />
   {config.text}
  </span>
 );
};

export function SyncDashboard({ integrationId }: { integrationId: string }) {
 const [filter, setFilter] = useState<JobStatus | 'all'>('all');
 // Sync jobs feature is planned for a future release
 const jobs: SyncJob[] = [];
 const isLoading = false;
 const featureNotReady = true; // Flag to show "coming soon" message

 const filteredJobs = jobs?.filter(job => filter === 'all' || job.status === filter) || [];

 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md">
   {/* Filter-flikar */}
   <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-2 flex-wrap">
    <button
     onClick={() => setFilter('all')}
     className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
      filter === 'all' 
       ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
       : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
     }`}
    >
     Alla
    </button>
    {(['pending', 'processing', 'completed', 'failed', 'requires_manual_resolution'] as const).map((status) => (
     <button
      key={status}
      onClick={() => setFilter(status)}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
       filter === status 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
     >
      {status === 'pending' ? 'Väntar' : status === 'processing' ? 'Bearbetar' : status === 'completed' ? 'Klar' : status === 'failed' ? 'Misslyckad' : 'Manuell åtgärd'}
     </button>
    ))}
   </div>

   {/* Jobblista */}
   <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
    {isLoading && <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin inline-block" /></div>}
    
    {featureNotReady && (
     <div className="p-6 text-center">
      <p className="text-gray-600 dark:text-gray-400 font-medium">Synkroniseringskö kommer snart</p>
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
       Hantering av synkroniseringsjobb implementeras i en kommande version.
      </p>
     </div>
    )}
    
    {!isLoading && !featureNotReady && filteredJobs.length === 0 && (
     <p className="p-6 text-center text-gray-500 dark:text-gray-400">Inga synkjobb att visa.</p>
    )}

    {filteredJobs.map((job) => (
     <div key={job.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
       <div>
        <span className="font-semibold text-gray-900 dark:text-white">{job.resource_type} ({job.action})</span>
        <p className="text-sm text-gray-500 dark:text-gray-400">
         Försök: {job.retry_count} • Prioritet: {job.priority}
        </p>
       </div>
       <div className="flex-shrink-0">
        <JobStatusBadge status={job.status} />
       </div>
      </div>
      {job.status === 'failed' && job.last_error && (
       <div className="mt-2 text-sm text-red-600 dark:text-red-400 p-2 bg-red-50 dark:bg-red-900/20 rounded">
        <strong>Fel:</strong> {job.last_error}
       </div>
      )}
      <div className="mt-2 text-xs text-gray-400 dark:text-gray-500">
       Skapad: {new Date(job.created_at).toLocaleString('sv-SE')}
       {job.updated_at && ` • Uppdaterad: ${new Date(job.updated_at).toLocaleString('sv-SE')}`}
      </div>
     </div>
    ))}
   </div>
  </div>
 );
}

