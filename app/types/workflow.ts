// app/types/workflow.ts

/**
 * Workflow Types
 * Based on Gemini implementation
 */

export type WorkflowStatus = 'pending' | 'processing' | 'partial_success' | 'success' | 'failed';

export type WorkflowStep =
  | 'upload'
  | 'ocr_processing'
  | 'data_extraction'
  | 'validation'
  | 'project_matching'
  | 'material_registration'
  | 'complete';

export interface WorkflowStateLog {
  step: WorkflowStep;
  status: 'success' | 'failed';
  message: string;
  timestamp: string;
}

export interface WorkflowExecution {
  id: string;
  workflow_type: 'delivery_note_processing' | 'invoice_approval' | 'form_submission';
  status: WorkflowStatus;
  current_step: WorkflowStep | null;
  file_path: string;
  state_log: WorkflowStateLog[];
  result_data?: any;
  error_message?: string;
  user_id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: string;
  read: boolean;
  workflow_id?: string;
}

