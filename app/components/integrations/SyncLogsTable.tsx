// app/components/integrations/SyncLogsTable.tsx

'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
 Table,
 TableHeader,
 TableBody,
 TableRow,
 TableHead,
 TableCell,
} from '@/components/ui/table';
import {
 CheckCircle,
 XCircle,
 Clock,
 ChevronDown,
 ChevronRight,
} from 'lucide-react';
import type { SyncLog } from '@/types/integrations';

interface SyncLogsTableProps {
 logs: SyncLog[];
 isLoading?: boolean;
}

const statusColors: Record<string, 'default' | 'success' | 'warning' | 'danger'> = {
 success: 'success',
 error: 'danger',
 pending: 'warning',
};

const statusIcons = {
 success: CheckCircle,
 error: XCircle,
 pending: Clock,
};

const statusLabels = {
 success: 'Lyckad',
 error: 'Misslyckad',
 pending: 'Väntande',
};

const operationLabels: Record<string, string> = {
 sync_invoice: 'Synka faktura',
 sync_customer: 'Synka kund',
 webhook: 'Webhook',
 manual: 'Manuell',
};

export function SyncLogsTable({ logs, isLoading }: SyncLogsTableProps) {
 const [filterStatus, setFilterStatus] = useState<string>('all');
 const [expandedLog, setExpandedLog] = useState<string | null>(null);

 if (isLoading) {
  return (
   <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 p-8">
    <div className="animate-pulse space-y-4">
     {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
     ))}
    </div>
   </div>
  );
 }

 const filteredLogs =
  filterStatus === 'all'
   ? logs
   : logs.filter((log) => log.status === filterStatus);

 return (
  <div className="bg-white dark:bg-gray-800 rounded-[8px] shadow-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
   {/* Header with Filter */}
   <div className="p-6 border-b border-gray-200 dark:border-gray-700">
    <div className="flex items-center justify-between">
     <h2 className="text-xl font-bold text-gray-900 dark:text-white">
      Synkroniseringsloggar
     </h2>
     <Select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="w-48"
     >
      <option value="all">Alla statusar</option>
      <option value="success">Lyckade</option>
      <option value="error">Misslyckade</option>
      <option value="pending">Väntande</option>
     </Select>
    </div>
   </div>

   {/* Table */}
   {filteredLogs.length === 0 ? (
    <div className="p-12 text-center">
     <p className="text-gray-600 dark:text-gray-400">Inga loggar att visa</p>
    </div>
   ) : (
    <Table>
     <TableHeader>
      <TableRow>
       <TableHead className="w-12">&nbsp;</TableHead>
       <TableHead>Tidpunkt</TableHead>
       <TableHead>Operation</TableHead>
       <TableHead>Resurs</TableHead>
       <TableHead>Status</TableHead>
       <TableHead>Duration</TableHead>
      </TableRow>
     </TableHeader>
     <TableBody>
      {filteredLogs.map((log) => {
       const StatusIcon = statusIcons[log.status];
       const isExpanded = expandedLog === log.id;

       return (
        <React.Fragment key={log.id}>
         <TableRow className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50">
          <TableCell>
           <button
            onClick={() =>
             setExpandedLog(isExpanded ? null : log.id)
            }
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
           >
            {isExpanded ? (
             <ChevronDown size={16} />
            ) : (
             <ChevronRight size={16} />
            )}
           </button>
          </TableCell>
          <TableCell className="text-sm">
           {new Date(log.created_at).toLocaleString('sv-SE')}
          </TableCell>
          <TableCell>
           <span className="font-medium">
            {operationLabels[log.operation] || log.operation}
           </span>
          </TableCell>
          <TableCell>
           <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
             {log.resource_type}
            </span>
            {log.resource_id && (
             <span className="text-xs text-gray-500 dark:text-gray-500">
              ({log.resource_id.slice(0, 8)})
             </span>
            )}
           </div>
          </TableCell>
          <TableCell>
           <Badge
            variant={statusColors[log.status]}
            className="flex items-center gap-1 w-fit"
           >
            <StatusIcon size={14} />
            {statusLabels[log.status]}
           </Badge>
          </TableCell>
          <TableCell className="text-sm">
           {log.duration_ms ? `${log.duration_ms}ms` : '-'}
          </TableCell>
         </TableRow>

         {/* Expanded Details */}
         {isExpanded && (
          <TableRow>
           <TableCell
            colSpan={6}
            className="bg-gray-50 dark:bg-gray-900/50"
           >
            <div className="p-4 space-y-3">
             {/* Error Details */}
             {log.status === 'error' && log.error_message && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
               <div className="flex items-start gap-2">
                <XCircle
                 size={16}
                 className="text-red-600 dark:text-red-400 mt-0.5"
                />
                <div>
                 <p className="text-sm font-medium text-red-900 dark:text-red-300">
                  {log.error_code || 'Error'}
                 </p>
                 <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                  {log.error_message}
                 </p>
                </div>
               </div>
              </div>
             )}

             {/* Metadata */}
             {log.metadata &&
              Object.keys(log.metadata).length > 0 && (
               <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 Metadata:
                </p>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 rounded p-3 overflow-x-auto">
                 {JSON.stringify(log.metadata, null, 2)}
                </pre>
               </div>
              )}

             {/* Retry Info */}
             {log.retry_count > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
               Försök: {log.retry_count + 1}
              </div>
             )}
            </div>
           </TableCell>
          </TableRow>
         )}
        </React.Fragment>
       );
      })}
     </TableBody>
    </Table>
   )}
  </div>
 );
}

