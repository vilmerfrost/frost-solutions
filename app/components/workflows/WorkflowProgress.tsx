// app/components/workflows/WorkflowProgress.tsx

/**
 * Workflow Progress Visualization Component
 * Based on Gemini implementation
 */

'use client';

import type { WorkflowExecution, WorkflowStep } from '@/types/workflow';
import { Check, Loader2, AlertTriangle, FileUp, Circle, Flag } from 'lucide-react';

// Definiera ordningen och etiketterna för alla möjliga steg
const ALL_STEPS: { id: WorkflowStep; label: string }[] = [
 { id: 'upload', label: 'File Uploaded' },
 { id: 'ocr_processing', label: 'OCR Processing' },
 { id: 'data_extraction', label: 'Data Extraction' },
 { id: 'validation', label: 'Validation' },
 { id: 'project_matching', label: 'Project Matching' }, // Specifik för faktura
 { id: 'material_registration', label: 'Material Registration' }, // Specifik för följesedel
 { id: 'complete', label: 'Complete' },
];

export function WorkflowProgress({ workflow }: { workflow: WorkflowExecution }) {
 const { status, current_step, state_log, workflow_type } = workflow;

 // Filtrera stegen baserat på arbetsflödestyp
 const relevantSteps = ALL_STEPS.filter((step) => {
  if (workflow_type === 'invoice_approval' && step.id === 'material_registration') return false;
  if (workflow_type === 'delivery_note_processing' && step.id === 'project_matching')
   return false;
  return true;
 });

 const currentStepIndex = relevantSteps.findIndex((s) => s.id === current_step);

 const getStepStatus = (stepId: WorkflowStep, index: number) => {
  const log = state_log?.find((l) => l.step === stepId);

  if (log) {
   return log.status === 'success' ? 'completed' : 'failed';
  }

  // Om det nuvarande steget har misslyckats
  if (status === 'failed' && index === currentStepIndex) {
   return 'failed';
  }

  // Om vi är på detta steg och processar
  if (status === 'processing' && index === currentStepIndex) {
   return 'processing';
  }

  // Om steget är före det nuvarande, eller om hela flödet är klart
  if (index < currentStepIndex || status === 'success' || status === 'partial_success') {
   return 'completed';
  }

  // Annars väntar det
  return 'pending';
 };

 const ICONS = {
  completed: <Check className="w-4 h-4 text-white" />,
  processing: <Loader2 className="w-4 h-4 text-white animate-spin" />,
  failed: <AlertTriangle className="w-4 h-4 text-white" />,
  pending: <Circle className="w-4 h-4 text-gray-300" />,
 };

 const COLORS = {
  completed: 'bg-green-500',
  processing: 'bg-blue-500 animate-pulse',
  failed: 'bg-red-500',
  pending: 'bg-gray-200 dark:bg-gray-700',
 };

 return (
  <div className="p-4">
   <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
    Workflow Progress
   </h3>
   <ol className="space-y-4" role="list" aria-label="Workflow steps">
    {relevantSteps.map((step, index) => {
     const stepStatus = getStepStatus(step.id, index);
     const icon =
      step.id === 'complete' ? (
       <Flag className="w-4 h-4 text-white" />
      ) : (
       ICONS[stepStatus]
      );

     return (
      <li key={step.id} className="flex items-center space-x-3">
       <span
        className={`flex h-8 w-8 items-center justify-center rounded-full ${COLORS[stepStatus]}`}
        aria-label={`${stepStatus} step`}
       >
        {icon}
       </span>
       <div className="flex flex-col">
        <h4
         className={`font-medium ${
          stepStatus === 'pending'
           ? 'text-gray-500'
           : 'text-gray-900 dark:text-white'
         }`}
        >
         {step.label}
        </h4>
        {stepStatus === 'failed' && (
         <p className="text-sm text-red-500">
          {state_log?.find((l) => l.step === step.id)?.message ||
           workflow.error_message}
         </p>
        )}
       </div>
      </li>
     );
    })}
   </ol>
  </div>
 );
}

