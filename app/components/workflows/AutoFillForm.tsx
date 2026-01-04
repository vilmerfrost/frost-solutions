// app/components/workflows/AutoFillForm.tsx

/**
 * Auto-fill Form Component
 * Based on Gemini implementation
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';
import supabase from '@/utils/supabase/supabaseClient';
import type { WorkflowExecution } from '@/types/workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Hook för att hämta det slutförda arbetsflödet
const useWorkflowResult = (id: string) => {
 return useQuery({
  queryKey: ['workflow', id],
  queryFn: async () => {
   const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', id)
    .in('status', ['success', 'partial_success', 'failed'])
    .single();

   if (error) throw error;
   return data as WorkflowExecution;
  },
 });
};

// Detta mappar OCR-datan till våra formulärfält
const mapDataToForm = (data: any) => {
 if (!data?.result_data) return {};

 const ocrData = data.result_data;
 return {
  supplier_name: ocrData.supplierName || null,
  total_amount: ocrData.totalAmount || ocrData.total || null,
  invoice_date: ocrData.invoiceDate || ocrData.deliveryDate || null,
  project_id: ocrData.projectMatches?.[0]?.projectId || ocrData.projectReference || null,
 };
};

export function AutoFillForm({ executionId }: { executionId: string }) {
 const { data: workflow, isLoading } = useWorkflowResult(executionId);
 const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set());

 const { register, handleSubmit, setValue } = useForm();

 // Auto-fill logik
 useEffect(() => {
  if (workflow?.result_data) {
   const mappedData = mapDataToForm(workflow);
   const fields = new Set<string>();

   Object.entries(mappedData).forEach(([key, value]) => {
    if (value) {
     setValue(key, value);
     fields.add(key);
    }
   });

   setAutoFilledFields(fields);
  }
 }, [workflow, setValue]);

 const onSubmit = (formData: any) => {
  console.log('Formulär sparat:', formData);
  // TODO: Mutation för att spara den godkända fakturan
 };

 if (isLoading) return <div>Laddar extraherad data...</div>;

 return (
  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 border rounded-lg">
   <h3 className="text-xl font-bold">Granska och godkänn faktura</h3>

   <FormFieldWrapper
    label="Leverantör"
    isAutoFilled={autoFilledFields.has('supplier_name')}
   >
    <Input {...register('supplier_name')} />
   </FormFieldWrapper>

   <FormFieldWrapper
    label="Totalbelopp"
    isAutoFilled={autoFilledFields.has('total_amount')}
   >
    <Input type="number" {...register('total_amount')} />
   </FormFieldWrapper>

   <FormFieldWrapper
    label="Fakturadatum"
    isAutoFilled={autoFilledFields.has('invoice_date')}
   >
    <Input type="date" {...register('invoice_date')} />
   </FormFieldWrapper>

   <FormFieldWrapper
    label="Projekt (Bästa matchning)"
    isAutoFilled={autoFilledFields.has('project_id')}
   >
    <select
     {...register('project_id')}
     className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
    >
     <option value="">Välj projekt...</option>
     {workflow?.result_data?.projectMatches?.map((match: any) => (
      <option key={match.projectId} value={match.projectId}>
       {match.name} ({Math.round(match.confidence * 100)}% match)
      </option>
     ))}
    </select>
   </FormFieldWrapper>

   <Button type="submit">Godkänn</Button>
  </form>
 );
}

// Hjälpkomponent för att visa "Auto-filled"
function FormFieldWrapper({
 label,
 children,
 isAutoFilled,
}: {
 label: string;
 children: React.ReactNode;
 isAutoFilled: boolean;
}) {
 return (
  <div>
   <label className="flex items-center justify-between text-sm font-medium mb-1">
    {label}
    {isAutoFilled && (
     <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
      Auto-ifylld
     </span>
    )}
   </label>
   {children}
  </div>
 );
}

