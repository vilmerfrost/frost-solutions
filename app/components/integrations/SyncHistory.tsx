// app/components/integrations/SyncHistory.tsx
"use client";

import { useState } from 'react';
import { useSyncLogs } from '@/hooks/useIntegrations';
import { Loader2, Info, AlertTriangle, XCircle, ChevronDown } from 'lucide-react';
import type { SyncLog } from '@/types/integrations';

const LogLevelIndicator = ({ level }: { level: SyncLog['level'] }) => {
 const config = {
  info: { icon: Info, color: 'text-blue-500' },
  warn: { icon: AlertTriangle, color: 'text-amber-500' },
  error: { icon: XCircle, color: 'text-red-500' },
 }[level];
 const Icon = config.icon;
 return <Icon className={`w-5 h-5 ${config.color} flex-shrink-0`} />;
};

const LogRow = ({ log }: { log: SyncLog }) => {
 const [isExpanded, setIsExpanded] = useState(false);
 const hasContext = log.context && Object.keys(log.context).length > 0;

 return (
  <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
   <div className="flex items-start gap-3">
    <LogLevelIndicator level={log.level} />
    <div className="flex-1">
     <p className="text-sm font-medium text-gray-900 dark:text-white">{log.message}</p>
     <span className="text-xs text-gray-500 dark:text-gray-400">
      {new Date(log.created_at).toLocaleString('sv-SE')}
     </span>
    </div>
    {hasContext && (
     <button 
      onClick={() => setIsExpanded(!isExpanded)} 
      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
      aria-label={isExpanded ? 'Dölj detaljer' : 'Visa detaljer'}
     >
      <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
     </button>
    )}
   </div>
   {isExpanded && hasContext && (
    <pre className="mt-3 p-3 bg-gray-100 dark:bg-gray-900 rounded-md text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
     {JSON.stringify(log.context, null, 2)}
    </pre>
   )}
  </div>
 );
};

export function SyncHistory({ integrationId }: { integrationId: string }) {
 const [filter, setFilter] = useState<SyncLog['level'] | 'all'>('all');
 const { data: logs, isLoading } = useSyncLogs(integrationId);

 const filteredLogs = logs
  ?.filter(log => filter === 'all' || log.level === filter)
  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  || [];

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
    {(['info', 'warn', 'error'] as const).map((level) => (
     <button
      key={level}
      onClick={() => setFilter(level)}
      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
       filter === level 
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
     >
      {level === 'info' ? 'Info' : level === 'warn' ? 'Varning' : 'Fel'}
     </button>
    ))}
   </div>

   <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
    {isLoading && <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin inline-block" /></div>}
    
    {!isLoading && filteredLogs.length === 0 && (
     <p className="p-6 text-center text-gray-500 dark:text-gray-400">Inga loggar att visa.</p>
    )}
    
    {filteredLogs.map((log) => (
     <LogRow key={log.id} log={log} />
    ))}
   </div>
  </div>
 );
}

