// app/components/workflows/LiveUpdatesDashboard.tsx

/**
 * Live Updates Dashboard Component
 * Based on Gemini implementation
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import supabase from '@/utils/supabase/supabaseClient';
import type { WorkflowExecution } from '@/types/workflow';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

// Hook för att hämta alla *aktiva* arbetsflöden
const useActiveWorkflows = (userId: string, filter: string) => {
  return useQuery({
    queryKey: ['workflows', 'active', userId, filter],
    queryFn: async () => {
      let query = supabase
        .from('workflow_executions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: false });

      if (filter) {
        query = query.ilike('file_path', `%${filter}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WorkflowExecution[];
    },
    refetchInterval: false,
  });
};

export function LiveUpdatesDashboard({ userId }: { userId: string }) {
  const [filter, setFilter] = useState('');
  const { data: workflows, isLoading, refetch, isRefetching } = useActiveWorkflows(userId, filter);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Aktiva Arbetsflöden</h1>

      <div className="flex gap-4 mb-4">
        <Input
          placeholder="Filtrera på filnamn..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
          <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading && <div className="text-center p-10">Laddar aktiva flöden...</div>}

      <div className="space-y-4">
        {workflows && workflows.length === 0 && (
          <div className="text-center p-10 text-gray-500">
            Inga aktiva arbetsflöden hittades.
          </div>
        )}

        {workflows?.map((wf) => <WorkflowCard key={wf.id} workflow={wf} />)}
      </div>
    </div>
  );
}

// Återanvändbar kort-komponent
function WorkflowCard({ workflow }: { workflow: WorkflowExecution }) {
  const ICONS = {
    pending: <Clock className="text-gray-500" />,
    processing: <Loader2 className="animate-spin text-blue-500" />,
    success: <CheckCircle className="text-green-500" />,
    failed: <AlertTriangle className="text-red-500" />,
    partial_success: <AlertTriangle className="text-yellow-500" />,
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        {ICONS[workflow.status]}
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {workflow.file_path.split('/').pop()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Status: {workflow.status} (Steg: {workflow.current_step || 'N/A'})
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant="default">
          {workflow.workflow_type.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}

