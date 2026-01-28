// app/components/WorkOrderModal.tsx

'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useEmployees } from '@/hooks/useEmployees';
import { useProjects } from '@/hooks/useProjects';
import { useCreateWorkOrder, useUpdateWorkOrder } from '@/hooks/useWorkOrders';
import { toast } from '@/lib/toast';
import { extractErrorMessage } from '@/lib/errorUtils';
import { X, Loader2, Plus, Trash2, Shield, Package, Clock, Users, AlertTriangle } from 'lucide-react';
import { CreateWorkOrderSchema, UpdateWorkOrderSchema } from '@/lib/schemas/work-order';
import type { WorkOrder, WorkOrderPriority, CreateWorkOrderRequest, UpdateWorkOrderRequest } from '@/types/work-orders';
import { useTenant } from '@/context/TenantContext';
import { BASE_PATH } from '@/utils/url';

interface WorkOrderModalProps {
 isOpen: boolean;
 onClose: () => void;
 workOrder?: WorkOrder | null;
}

type WorkOrderType = 'standard' | 'ata' | 'damage' | 'sales';
type EstimatedHours = '2-4h' | '4-8h' | '8-16h' | '16+h' | 'multi-day';

interface MaterialRequirement {
 material_id?: string;
 name: string;
 quantity: number;
 unit: string;
}

interface AssignedEmployee {
 employee_id: string;
 is_primary: boolean;
}

interface AetaRequest {
 id: string;
 title: string;
}

interface Material {
 id: string;
 name: string;
 unit?: string;
}

const WORK_ORDER_TYPES: { value: WorkOrderType; label: string; description: string }[] = [
 { value: 'standard', label: 'Standard arbete', description: 'Vanligt arbetsuppdrag' },
 { value: 'ata', label: 'ÄTA', description: 'Ändrings-/tilläggsarbete' },
 { value: 'damage', label: 'Skadat gods', description: 'Hantering av skadat material' },
 { value: 'sales', label: 'Försäljning/Material', description: 'Materialförsäljning' },
];

const ESTIMATED_HOURS: { value: EstimatedHours; label: string }[] = [
 { value: '2-4h', label: '2-4 timmar' },
 { value: '4-8h', label: '4-8 timmar' },
 { value: '8-16h', label: '8-16 timmar' },
 { value: '16+h', label: '16+ timmar' },
 { value: 'multi-day', label: 'Flera dagar' },
];

const SAFETY_OPTIONS = [
 { key: 'ppe', label: 'Skyddsutrustning (PPE)', icon: '🥽' },
 { key: 'safety_training', label: 'Arbetsmiljöutbildning krävs', icon: '📋' },
 { key: 'first_aid', label: 'Första-hjälp-kit på plats', icon: '🩹' },
 { key: 'zone_marking', label: 'Avspärrning av arbetsområde', icon: '⚠️' },
 { key: 'photo_before_after', label: 'Fotografera före/efter', icon: '📸' },
];

const toInputDate = (isoString?: string | null): string => {
 if (!isoString) return '';
 try {
  return isoString.split('T')[0];
 } catch (e) { 
  return ''; 
 }
};

export function WorkOrderModal({ isOpen, onClose, workOrder }: WorkOrderModalProps) {
 const { tenantId } = useTenant();
 
 // Basic form state
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [projectId, setProjectId] = useState('');
 const [priority, setPriority] = useState<WorkOrderPriority>('medium');
 const [scheduledDate, setScheduledDate] = useState('');
 
 // Enhanced form state
 const [workOrderType, setWorkOrderType] = useState<WorkOrderType>('standard');
 const [estimatedHours, setEstimatedHours] = useState<EstimatedHours | ''>('');
 const [aetaRequestId, setAetaRequestId] = useState('');
 const [specialInstructions, setSpecialInstructions] = useState('');
 
 // Multiple assignments
 const [assignedEmployees, setAssignedEmployees] = useState<AssignedEmployee[]>([]);
 
 // Material requirements
 const [materialRequirements, setMaterialRequirements] = useState<MaterialRequirement[]>([]);
 
 // Safety requirements
 const [safetyRequirements, setSafetyRequirements] = useState<Set<string>>(new Set());
 
 // Visibility
 const [visibleToAssignees, setVisibleToAssignees] = useState(true);
 const [visibleToProjectLead, setVisibleToProjectLead] = useState(true);
 const [visibleToAdmin, setVisibleToAdmin] = useState(true);
 
 // Data
 const [aetaRequests, setAetaRequests] = useState<AetaRequest[]>([]);
 const [materials, setMaterials] = useState<Material[]>([]);
 
 const [isLoading, setIsLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 
 const { data: employees, isLoading: isLoadingEmployees } = useEmployees();
 const { data: projects, isLoading: isLoadingProjects } = useProjects();
 
 const createWorkOrder = useCreateWorkOrder();
 const updateWorkOrder = useUpdateWorkOrder();

 // Fetch ÄTA requests for project
 useEffect(() => {
  if (!projectId || !tenantId) {
   setAetaRequests([]);
   return;
  }
  
  async function fetchAeta() {
   try {
    const res = await fetch(`${BASE_PATH}/api/aeta?projectId=${projectId}&status=approved`, { cache: 'no-store' });
    if (res.ok) {
     const data = await res.json();
     setAetaRequests(data.data || []);
    }
   } catch (err) {
    console.error('Error fetching ÄTA:', err);
   }
  }
  fetchAeta();
 }, [projectId, tenantId]);

 // Fetch materials
 useEffect(() => {
  if (!tenantId) return;
  
  async function fetchMaterials() {
   try {
    const res = await fetch(`${BASE_PATH}/api/materials/list?tenantId=${tenantId}`, { cache: 'no-store' });
    if (res.ok) {
     const data = await res.json();
     setMaterials(data.materials || []);
    }
   } catch (err) {
    console.error('Error fetching materials:', err);
   }
  }
  fetchMaterials();
 }, [tenantId]);

 // Fill form on edit
 useEffect(() => {
  if (workOrder) {
   setTitle(workOrder.title);
   setDescription(workOrder.description || '');
   setProjectId(workOrder.project_id || '');
   setPriority(workOrder.priority);
   setScheduledDate(toInputDate(workOrder.scheduled_date));
   
   // Enhanced fields
   setWorkOrderType((workOrder as any).work_order_type || 'standard');
   setEstimatedHours((workOrder as any).estimated_hours || '');
   setAetaRequestId((workOrder as any).aeta_request_id || '');
   setSpecialInstructions((workOrder as any).special_instructions || '');
   setMaterialRequirements((workOrder as any).material_requirements || []);
   setSafetyRequirements(new Set((workOrder as any).safety_requirements || []));
   setVisibleToAssignees((workOrder as any).visible_to_assignees ?? true);
   setVisibleToProjectLead((workOrder as any).visible_to_project_lead ?? true);
   setVisibleToAdmin((workOrder as any).visible_to_admin ?? true);
   
   // Handle single assignment from existing work order
   if (workOrder.assigned_to) {
    setAssignedEmployees([{ employee_id: workOrder.assigned_to, is_primary: true }]);
   }
  } else {
   // Reset for new
   setTitle('');
   setDescription('');
   setProjectId('');
   setPriority('medium');
   setScheduledDate('');
   setWorkOrderType('standard');
   setEstimatedHours('');
   setAetaRequestId('');
   setSpecialInstructions('');
   setAssignedEmployees([]);
   setMaterialRequirements([]);
   setSafetyRequirements(new Set());
   setVisibleToAssignees(true);
   setVisibleToProjectLead(true);
   setVisibleToAdmin(true);
  }
  setError(null);
 }, [workOrder, isOpen]);

 // Add assigned employee
 const addAssignedEmployee = () => {
  setAssignedEmployees([...assignedEmployees, { employee_id: '', is_primary: false }]);
 };

 // Remove assigned employee
 const removeAssignedEmployee = (index: number) => {
  setAssignedEmployees(assignedEmployees.filter((_, i) => i !== index));
 };

 // Update assigned employee
 const updateAssignedEmployee = (index: number, field: keyof AssignedEmployee, value: any) => {
  const updated = [...assignedEmployees];
  updated[index] = { ...updated[index], [field]: value };
  
  // Ensure only one primary
  if (field === 'is_primary' && value === true) {
   updated.forEach((e, i) => {
    if (i !== index) e.is_primary = false;
   });
  }
  
  setAssignedEmployees(updated);
 };

 // Add material requirement
 const addMaterialRequirement = () => {
  setMaterialRequirements([...materialRequirements, { name: '', quantity: 1, unit: 'st' }]);
 };

 // Remove material requirement
 const removeMaterialRequirement = (index: number) => {
  setMaterialRequirements(materialRequirements.filter((_, i) => i !== index));
 };

 // Update material requirement
 const updateMaterialRequirement = (index: number, field: keyof MaterialRequirement, value: any) => {
  const updated = [...materialRequirements];
  updated[index] = { ...updated[index], [field]: value };
  setMaterialRequirements(updated);
 };

 // Toggle safety requirement
 const toggleSafety = (key: string) => {
  setSafetyRequirements(prev => {
   const next = new Set(prev);
   if (next.has(key)) {
    next.delete(key);
   } else {
    next.add(key);
   }
   return next;
  });
 };

 const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);

  // Get primary assigned employee for backward compatibility
  const primaryAssignee = assignedEmployees.find(e => e.is_primary)?.employee_id 
   || assignedEmployees[0]?.employee_id 
   || null;

  const formData = {
   title,
   description: description || null,
   project_id: projectId || null,
   assigned_to: primaryAssignee,
   priority,
   scheduled_date: scheduledDate || null,
   // Enhanced fields
   work_order_type: workOrderType,
   estimated_hours: estimatedHours || null,
   aeta_request_id: workOrderType === 'ata' ? aetaRequestId || null : null,
   special_instructions: specialInstructions || null,
   material_requirements: materialRequirements.filter(m => m.name),
   safety_requirements: Array.from(safetyRequirements),
   visible_to_assignees: visibleToAssignees,
   visible_to_project_lead: visibleToProjectLead,
   visible_to_admin: visibleToAdmin,
   // For assignments table
   assignments: assignedEmployees.filter(e => e.employee_id),
  };
  
  // Zod validation (basic schema - enhanced fields go through)
  const schema = workOrder ? UpdateWorkOrderSchema : CreateWorkOrderSchema;
  const validationResult = schema.safeParse({
   title: formData.title,
   description: formData.description,
   project_id: formData.project_id,
   assigned_to: formData.assigned_to,
   priority: formData.priority,
   scheduled_date: formData.scheduled_date,
  });
  
  if (!validationResult.success) {
   const firstError = validationResult.error.issues[0]?.message || 'Ogiltig indata';
   setError(firstError);
   toast.error(firstError);
   setIsLoading(false);
   return;
  }

  try {
   if (workOrder) {
    await updateWorkOrder.mutateAsync({
     id: workOrder.id,
     ...formData as any,
    });
   } else {
    if (!formData.title) {
     throw new Error('Titel krävs');
    }
    await createWorkOrder.mutateAsync(formData as any);
   }
   onClose();
  } catch (err) {
   const message = extractErrorMessage(err);
   setError(message);
  } finally {
   setIsLoading(false);
  }
 };

 if (!isOpen) return null;

 return (
  <>
   {/* Backdrop */}
   <div
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={onClose}
    aria-hidden="true"
   />
   
   {/* Modal */}
   <div 
    className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center p-0 sm:p-4"
    role="dialog"
    aria-modal="true"
   >
    <div className="bg-gray-50 dark:bg-gray-900 rounded-t-2xl sm:rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col">
     {/* Header */}
     <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
       {workOrder ? 'Redigera Arbetsorder' : 'Skapa Arbetsorder'}
      </h2>
      <button
       type="button"
       onClick={onClose}
       className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
       <X className="w-5 h-5" />
      </button>
     </div>
     
     {/* Form */}
     <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-grow">
      {error && (
       <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg">
        {error}
       </div>
      )}
      
      {/* Work Order Type */}
      <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Arbetsorder-typ *
       </label>
       <div className="grid grid-cols-2 gap-2">
        {WORK_ORDER_TYPES.map((type) => (
         <button
          key={type.value}
          type="button"
          onClick={() => setWorkOrderType(type.value)}
          className={`p-3 rounded-lg border-2 text-left transition-all ${
           workOrderType === type.value
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
         >
          <span className="font-medium text-sm">{type.label}</span>
          <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
         </button>
        ))}
       </div>
      </div>
      
      {/* Title & Description */}
      <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Titel *
       </label>
       <input 
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        placeholder="T.ex. Rivning gamla badrumsmöbler"
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
       />
      </div>
      
      <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Arbetsspecifikation
       </label>
       <textarea 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        placeholder="Beskriv arbetet i detalj..."
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
       />
      </div>
      
      {/* Project & ÄTA Link */}
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Projekt *
        </label>
        <select 
         value={projectId} 
         onChange={(e) => setProjectId(e.target.value)}
         disabled={isLoadingProjects}
         className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
         required
        >
         <option value="">Välj projekt...</option>
         {projects?.map(proj => (
          <option key={proj.id} value={proj.id}>{proj.name}</option>
         ))}
        </select>
       </div>
       
       {workOrderType === 'ata' && (
        <div>
         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kopplad ÄTA
         </label>
         <select 
          value={aetaRequestId} 
          onChange={(e) => setAetaRequestId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
         >
          <option value="">Välj ÄTA...</option>
          {aetaRequests.map(ata => (
           <option key={ata.id} value={ata.id}>{ata.title}</option>
          ))}
         </select>
        </div>
       )}
      </div>
      
      {/* Estimated Hours & Date */}
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
         <Clock className="w-4 h-4 inline mr-1" />
         Estimerad arbetstid
        </label>
        <div className="flex flex-wrap gap-2">
         {ESTIMATED_HOURS.map((opt) => (
          <button
           key={opt.value}
           type="button"
           onClick={() => setEstimatedHours(opt.value)}
           className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            estimatedHours === opt.value
             ? 'bg-primary-500 text-white'
             : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
           }`}
          >
           {opt.label}
          </button>
         ))}
        </div>
       </div>
       
       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
         Planerat startdatum
        </label>
        <input 
         type="date"
         value={scheduledDate}
         onChange={(e) => setScheduledDate(e.target.value)}
         className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        />
       </div>
      </div>
      
      {/* Assigned Employees */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
       <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
         <Users className="w-4 h-4" />
         Tilldelade medarbetare
        </label>
        <button
         type="button"
         onClick={addAssignedEmployee}
         className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
         <Plus className="w-4 h-4" />
         Lägg till
        </button>
       </div>
       
       {assignedEmployees.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">Ingen tilldelad ännu</p>
       ) : (
        <div className="space-y-2">
         {assignedEmployees.map((assignment, idx) => (
          <div key={idx} className="flex items-center gap-2">
           <select
            value={assignment.employee_id}
            onChange={(e) => updateAssignedEmployee(idx, 'employee_id', e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
           >
            <option value="">Välj medarbetare...</option>
            {employees?.map((emp: any) => (
             <option key={emp.id} value={emp.id}>
              {emp.full_name || emp.name}
             </option>
            ))}
           </select>
           <label className="flex items-center gap-1 text-xs whitespace-nowrap">
            <input
             type="checkbox"
             checked={assignment.is_primary}
             onChange={(e) => updateAssignedEmployee(idx, 'is_primary', e.target.checked)}
             className="rounded"
            />
            Huvudansvarig
           </label>
           <button
            type="button"
            onClick={() => removeAssignedEmployee(idx)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
           >
            <Trash2 className="w-4 h-4" />
           </button>
          </div>
         ))}
        </div>
       )}
      </div>
      
      {/* Material Requirements */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
       <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
         <Package className="w-4 h-4" />
         Material & Verktyg
        </label>
        <button
         type="button"
         onClick={addMaterialRequirement}
         className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
        >
         <Plus className="w-4 h-4" />
         Lägg till
        </button>
       </div>
       
       {materialRequirements.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">Inget material specificerat</p>
       ) : (
        <div className="space-y-2">
         {materialRequirements.map((mat, idx) => (
          <div key={idx} className="flex items-center gap-2">
           <select
            value={mat.material_id || ''}
            onChange={(e) => {
             const m = materials.find(m => m.id === e.target.value);
             updateMaterialRequirement(idx, 'material_id', e.target.value);
             if (m) {
              updateMaterialRequirement(idx, 'name', m.name);
              if (m.unit) updateMaterialRequirement(idx, 'unit', m.unit);
             }
            }}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
           >
            <option value="">Välj material eller skriv fritt...</option>
            {materials.map((m) => (
             <option key={m.id} value={m.id}>{m.name}</option>
            ))}
           </select>
           <input
            type="number"
            value={mat.quantity}
            onChange={(e) => updateMaterialRequirement(idx, 'quantity', Number(e.target.value))}
            min="1"
            className="w-20 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
           />
           <select
            value={mat.unit}
            onChange={(e) => updateMaterialRequirement(idx, 'unit', e.target.value)}
            className="w-20 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
           >
            <option value="st">st</option>
            <option value="m">m</option>
            <option value="m²">m²</option>
            <option value="kg">kg</option>
            <option value="l">l</option>
           </select>
           <button
            type="button"
            onClick={() => removeMaterialRequirement(idx)}
            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
           >
            <Trash2 className="w-4 h-4" />
           </button>
          </div>
         ))}
        </div>
       )}
      </div>
      
      {/* Safety Requirements */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
       <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4" />
        Säkerhetskrav
       </label>
       <div className="grid grid-cols-2 gap-2">
        {SAFETY_OPTIONS.map((opt) => (
         <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
          <input
           type="checkbox"
           checked={safetyRequirements.has(opt.key)}
           onChange={() => toggleSafety(opt.key)}
           className="rounded border-gray-300 text-primary-500"
          />
          <span className="text-sm">{opt.icon} {opt.label}</span>
         </label>
        ))}
       </div>
      </div>
      
      {/* Priority */}
      <div className="grid grid-cols-2 gap-4">
       <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
         Prioritet
        </label>
        <div className="flex gap-2">
         {[
          { value: 'low', label: 'Normal', color: 'bg-gray-100 text-gray-700' },
          { value: 'medium', label: 'Hög', color: 'bg-yellow-100 text-yellow-700' },
          { value: 'high', label: 'URGENT', color: 'bg-red-100 text-red-700' },
         ].map((p) => (
          <button
           key={p.value}
           type="button"
           onClick={() => setPriority(p.value as WorkOrderPriority)}
           className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            priority === p.value
             ? p.value === 'high' 
               ? 'bg-red-500 text-white' 
               : p.value === 'medium'
                 ? 'bg-yellow-500 text-white'
                 : 'bg-primary-500 text-white'
             : p.color
           }`}
          >
           {p.label}
          </button>
         ))}
        </div>
       </div>
      </div>
      
      {/* Special Instructions */}
      <div>
       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Speciella instruktioner
       </label>
       <textarea 
        value={specialInstructions}
        onChange={(e) => setSpecialInstructions(e.target.value)}
        rows={2}
        placeholder="Ytterligare instruktioner för medarbetarna..."
        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
       />
      </div>
      
      {/* Visibility */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
       <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
        Synlighet
       </label>
       <div className="flex gap-4 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
         <input
          type="checkbox"
          checked={visibleToAssignees}
          onChange={(e) => setVisibleToAssignees(e.target.checked)}
          className="rounded border-gray-300 text-primary-500"
         />
         <span className="text-sm">Tilldelade medarbetare</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
         <input
          type="checkbox"
          checked={visibleToProjectLead}
          onChange={(e) => setVisibleToProjectLead(e.target.checked)}
          className="rounded border-gray-300 text-primary-500"
         />
         <span className="text-sm">Projektledare</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
         <input
          type="checkbox"
          checked={visibleToAdmin}
          onChange={(e) => setVisibleToAdmin(e.target.checked)}
          className="rounded border-gray-300 text-primary-500"
         />
         <span className="text-sm">Admin</span>
        </label>
       </div>
      </div>
     </form>
     
     {/* Footer */}
     <div className="flex justify-end gap-3 p-4 border-t dark:border-gray-700">
      <button
       type="button"
       onClick={onClose}
       disabled={isLoading}
       className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
      >
       Avbryt
      </button>
      <button
       type="submit"
       onClick={handleSubmit}
       disabled={isLoading}
       className="px-6 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 flex items-center gap-2 disabled:opacity-50"
      >
       {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Skapa Arbetsorder'}
      </button>
     </div>
    </div>
   </div>
  </>
 );
}
