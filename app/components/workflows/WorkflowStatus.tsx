// app/components/workflows/WorkflowStatus.tsx

/**
 * Individual Workflow Status Component
 * Based on Gemini implementation
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import supabase from '@/utils/supabase/supabaseClient';
import type { WorkflowExecution } from '@/types/workflow';
import { WorkflowProgress } from './WorkflowProgress';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';
import { useWorkflowStore } from '@/lib/store/workflowStore';

// Hook för att hämta ett enskilt arbetsflöde
const useWorkflow = (executionId: string) => {
 return useQuery({
  queryKey: ['workflow', executionId],
  queryFn: async () => {
   const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', executionId)
    .single();

   if (error) throw error;
   return data as WorkflowExecution;
  },
  staleTime: 1000 * 60 * 60, // 1 timme
 });
};

export function WorkflowStatus({ executionId }: { executionId: string }) {
 const { data: workflow, isLoading } = useWorkflow(executionId);
 const connection = useWorkflowStore((s) => s.connection);

 if (isLoading) {
  return (
   <div className="flex items-center justify-center h-64 p-6 border rounded-lg shadow-md">
    <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
    <p className="ml-4 text-lg text-gray-600">Laddar Workflow...</p>
   </div>
  );
 }

 if (!workflow) return <div>Workflow not found.</div>;

 // Enkel progress-beräkning
 const totalSteps =
  workflow.workflow_type === 'invoice_approval' ? 6 : 5;
 const currentStepIndex =
  (workflow.state_log?.length || 0) + (workflow.status === 'processing' ? 1 : 0);
 const progress = (currentStepIndex / totalSteps) * 100;

 return (
  <div className="p-6 border rounded-lg shadow-md bg-gray-50 dark:bg-gray-900">
   <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
     Status:{' '}
     <span className="capitalize">
      {workflow.status.replace('_', ' ')}
     </span>
    </h2>
    {connection !== 'connected' && (
     <span className="text-xs text-yellow-600">
      (Offline - visar senast kända status)
     </span>
    )}
   </div>
   <p className="mb-2 text-gray-600 dark:text-gray-300">
    Fil: {workflow.file_path.split('/').pop()}
   </p>
   <p className="mb-4 text-gray-600 dark:text-gray-300">
    Nuvarande steg: {workflow.current_step || 'väntar'}...
   </p>

   <Progress value={progress} className="w-full mb-6" showLabel />

   {workflow.status === 'failed' && (
    <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-200 rounded">
     <strong>Fel:</strong> {workflow.error_message}
    </div>
   )}

   {/* Tidslinjen */}
   <WorkflowProgress workflow={workflow} />
  </div>
 );
}

