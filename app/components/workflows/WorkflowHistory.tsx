// app/components/workflows/WorkflowHistory.tsx

/**
 * Workflow History Component
 * Based on Gemini implementation
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import supabase from '@/utils/supabase/supabaseClient';
import type { WorkflowExecution } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { FileText, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const useWorkflowHistory = (userId: string, page: number) => {
  return useQuery({
    queryKey: ['workflows', 'history', userId, page],
    queryFn: async () => {
      const from = page * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from('workflow_executions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .in('status', ['success', 'failed', 'partial_success'])
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      return {
        workflows: (data as WorkflowExecution[]) || [],
        total: count || 0,
        hasMore: (count || 0) > to + 1,
      };
    },
  });
};

export function WorkflowHistory({ userId }: { userId: string }) {
  const [page, setPage] = useState(0);
  const { data, isLoading } = useWorkflowHistory(userId, page);

  if (isLoading) {
    return <div className="text-center p-10">Laddar historik...</div>;
  }

  if (!data || data.workflows.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Ingen historik hittades"
        description="När du har slutfört några arbetsflöden kommer de att visas här."
      />
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Arbetsflödeshistorik</h1>

      <div className="space-y-4 mb-6">
        {data.workflows.map((wf) => (
          <WorkflowHistoryItem key={wf.id} workflow={wf} />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          Föregående
        </Button>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          Sida {page + 1} · Totalt {data.total} arbetsflöden
        </span>
        <Button
          variant="outline"
          onClick={() => setPage((p) => p + 1)}
          disabled={!data.hasMore}
        >
          Nästa
        </Button>
      </div>
    </div>
  );
}

function WorkflowHistoryItem({ workflow }: { workflow: WorkflowExecution }) {
  const statusIcons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    failed: <AlertTriangle className="w-5 h-5 text-red-500" />,
    partial_success: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
  };

  const statusBadges = {
    success: 'success',
    failed: 'danger',
    partial_success: 'warning',
  } as const;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4 flex-1">
        {statusIcons[workflow.status]}
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-white">
            {workflow.file_path.split('/').pop()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(workflow.created_at).toLocaleString('sv-SE')}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <Badge variant={statusBadges[workflow.status]}>
          {workflow.status.replace('_', ' ')}
        </Badge>
        <Badge variant="default">
          {workflow.workflow_type.replace('_', ' ')}
        </Badge>
      </div>
    </div>
  );
}

