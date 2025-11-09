// app/lib/workflows/orchestrator.ts

/**
 * Workflow Orchestration Helpers
 * Based on Gemini implementation for workflow state management
 */

import { createAdminClient } from '@/utils/supabase/admin';

export type WorkflowType = 'delivery_note_processing' | 'invoice_approval' | 'form_submission';

export type WorkflowStatus = 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';

export interface WorkflowStep {
  step: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Update workflow step
 */
export async function updateWorkflowStep(
  executionId: string,
  step: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  
  // Get current workflow
  const { data: workflow } = await admin
    .from('workflow_executions')
    .select('execution_history, context_data')
    .eq('id', executionId)
    .single();

  if (!workflow) {
    throw new Error(`Workflow ${executionId} not found`);
  }

  const history = (workflow.execution_history as WorkflowStep[]) || [];
  const newStep: WorkflowStep = {
    step,
    status: 'running',
    startedAt: new Date().toISOString(),
    metadata,
  };

  history.push(newStep);

  await admin
    .from('workflow_executions')
    .update({
      current_step: step,
      execution_history: history,
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId);
}

/**
 * Complete workflow step
 */
export async function completeWorkflowStep(
  executionId: string,
  step: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  
  const { data: workflow } = await admin
    .from('workflow_executions')
    .select('execution_history')
    .eq('id', executionId)
    .single();

  if (!workflow) return;

  const history = (workflow.execution_history as WorkflowStep[]) || [];
  const stepIndex = history.findIndex((s) => s.step === step && s.status === 'running');

  if (stepIndex >= 0) {
    history[stepIndex] = {
      ...history[stepIndex],
      status: 'completed',
      completedAt: new Date().toISOString(),
      metadata: { ...history[stepIndex].metadata, ...metadata },
    };
  }

  await admin
    .from('workflow_executions')
    .update({
      execution_history: history,
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId);
}

/**
 * Fail workflow step
 */
export async function failWorkflowStep(
  executionId: string,
  step: string,
  error: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  
  const { data: workflow } = await admin
    .from('workflow_executions')
    .select('execution_history')
    .eq('id', executionId)
    .single();

  if (!workflow) return;

  const history = (workflow.execution_history as WorkflowStep[]) || [];
  const stepIndex = history.findIndex((s) => s.step === step && s.status === 'running');

  if (stepIndex >= 0) {
    history[stepIndex] = {
      ...history[stepIndex],
      status: 'failed',
      completedAt: new Date().toISOString(),
      error,
      metadata: { ...history[stepIndex].metadata, ...metadata },
    };
  }

  await admin
    .from('workflow_executions')
    .update({
      status: 'failed',
      current_step: step,
      error_message: error,
      execution_history: history,
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId);
}

/**
 * Complete workflow
 */
export async function completeWorkflow(
  executionId: string,
  status: 'completed' | 'partial_success',
  resultData: Record<string, unknown>
): Promise<void> {
  const admin = createAdminClient();
  
  await admin
    .from('workflow_executions')
    .update({
      status: status === 'completed' ? 'completed' : 'completed',
      current_step: 'completed',
      result_data: resultData,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', executionId);
}

/**
 * Create workflow execution
 */
export async function createWorkflowExecution(params: {
  tenantId: string;
  workflowType: WorkflowType;
  entityType: string;
  entityId: string;
  initiatedBy?: string;
  contextData?: Record<string, unknown>;
}): Promise<string> {
  const admin = createAdminClient();
  
  const { data, error } = await admin
    .from('workflow_executions')
    .insert({
      tenant_id: params.tenantId,
      workflow_type: params.workflowType,
      workflow_name: getWorkflowName(params.workflowType),
      entity_type: params.entityType,
      entity_id: params.entityId,
      current_step: 'pending',
      status: 'running',
      context_data: params.contextData || {},
      initiated_by: params.initiatedBy || null,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to create workflow: ${error?.message}`);
  }

  return data.id;
}

function getWorkflowName(type: WorkflowType): string {
  switch (type) {
    case 'delivery_note_processing':
      return 'Delivery Note Processing';
    case 'invoice_approval':
      return 'Invoice Approval';
    case 'form_submission':
      return 'Form Submission';
    default:
      return 'Unknown Workflow';
  }
}

