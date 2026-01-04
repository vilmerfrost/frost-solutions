// app/hooks/useWorkOrders.ts

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTenant } from '@/context/TenantContext';
import { extractErrorMessage } from '@/lib/errorUtils';
import { toast } from '@/lib/toast';
import type { 
 WorkOrder, 
 WorkOrderFilters, 
 CreateWorkOrderRequest, 
 UpdateWorkOrderRequest,
 WorkOrderPhoto,
 UpdateStatusRequest
} from '@/types/work-orders';
import type { WorkOrderStatus } from '@/lib/work-order-state-machine';

// --- Query Keys ---
const getWorkOrdersQueryKey = (tenantId: string | null, filters: WorkOrderFilters) => 
 ['workOrders', tenantId, filters];

const getWorkOrderQueryKey = (tenantId: string | null, id: string) => 
 ['workOrder', tenantId, id];

const getWorkOrderPhotosQueryKey = (tenantId: string | null, workOrderId: string) => 
 ['workOrderPhotos', tenantId, workOrderId];

// Helper to fetch with error handling
async function fetchWorkOrders(url: string): Promise<WorkOrder[]> {
 const response = await fetch(url, { cache: 'no-store' });
 if (!response.ok) {
  const error = await response.json().catch(() => ({ error: 'Kunde inte hämta arbetsordrar' }));
  throw new Error(extractErrorMessage(error));
 }
 const data = await response.json();
 return Array.isArray(data) ? data : [];
}

async function fetchWorkOrder(url: string): Promise<WorkOrder> {
 const response = await fetch(url, { cache: 'no-store' });
 if (!response.ok) {
  const error = await response.json().catch(() => ({ error: 'Kunde inte hämta arbetsorder' }));
  throw new Error(extractErrorMessage(error));
 }
 return response.json();
}

async function fetchWorkOrderPhotos(url: string): Promise<WorkOrderPhoto[]> {
 const response = await fetch(url, { cache: 'no-store' });
 if (!response.ok) {
  const error = await response.json().catch(() => ({ error: 'Kunde inte hämta foton' }));
  throw new Error(extractErrorMessage(error));
 }
 const data = await response.json();
 return Array.isArray(data) ? data : [];
}

// --- HOOKS ---

/**
 * Hämtar en lista av arbetsordrar med filter
 */
export function useWorkOrders(filters: WorkOrderFilters = {}) {
 const { tenantId } = useTenant();

 const queryKey = getWorkOrdersQueryKey(tenantId, filters);

 return useQuery<WorkOrder[]>({
  queryKey,
  queryFn: async () => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const params = new URLSearchParams();
   if (filters.status) params.set('status', filters.status);
   if (filters.priority) params.set('priority', filters.priority);
   if (filters.project_id) params.set('project_id', filters.project_id);
   if (filters.assigned_to) params.set('assigned_to', filters.assigned_to);
   if (filters.limit) params.set('limit', filters.limit.toString());
   if (filters.offset) params.set('offset', filters.offset.toString());

   const queryString = params.toString();
   const url = `/api/work-orders${queryString ? `?${queryString}` : ''}`;
   
   return fetchWorkOrders(url);
  },
  enabled: !!tenantId,
 });
}

/**
 * Hämtar en specifik arbetsorder
 */
export function useWorkOrder(id: string) {
 const { tenantId } = useTenant();

 const queryKey = getWorkOrderQueryKey(tenantId, id);

 return useQuery<WorkOrder>({
  queryKey,
  queryFn: async () => {
   if (!tenantId || !id) throw new Error('Tenant ID eller Work Order ID saknas');
   return fetchWorkOrder(`/api/work-orders/${id}`);
  },
  enabled: !!tenantId && !!id,
 });
}

/**
 * Skapar en ny arbetsorder
 */
export function useCreateWorkOrder() {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<WorkOrder, Error, CreateWorkOrderRequest>({
  mutationFn: async (newWorkOrder) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const response = await fetch('/api/work-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newWorkOrder),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Kunde inte skapa arbetsorder' }));
    throw new Error(extractErrorMessage(error));
   }

   return response.json();
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['workOrders'] });
   toast.success('Arbetsorder skapad');
  },
  onError: (error) => {
   toast.error(extractErrorMessage(error));
  },
 });
}

/**
 * Uppdaterar en arbetsorder
 */
export function useUpdateWorkOrder() {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<WorkOrder, Error, UpdateWorkOrderRequest & { id: string }>({
  mutationFn: async ({ id, ...updatedData }) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const response = await fetch(`/api/work-orders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Kunde inte uppdatera arbetsorder' }));
    throw new Error(extractErrorMessage(error));
   }

   return response.json();
  },
  onSuccess: (data) => {
   queryClient.invalidateQueries({ queryKey: ['workOrders'] });
   queryClient.setQueryData(getWorkOrderQueryKey(tenantId, data.id), data);
   toast.success('Arbetsorder uppdaterad');
  },
  onError: (error) => {
   toast.error(extractErrorMessage(error));
  },
 });
}

/**
 * Tar bort en arbetsorder
 */
export function useDeleteWorkOrder() {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<void, Error, string>({
  mutationFn: async (id) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const response = await fetch(`/api/work-orders/${id}`, {
    method: 'DELETE',
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Kunde inte ta bort arbetsorder' }));
    throw new Error(extractErrorMessage(error));
   }
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ queryKey: ['workOrders'] });
   toast.success('Arbetsorder borttagen');
  },
  onError: (error) => {
   toast.error(extractErrorMessage(error));
  },
 });
}

/**
 * Ändrar status på en arbetsorder (via State Machine)
 */
export function useWorkOrderStatusTransition() {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<WorkOrder, Error, { id: string; to_status: WorkOrderStatus; reason?: string | null }>({
  mutationFn: async ({ id, to_status, reason }) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const response = await fetch(`/api/work-orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to_status, reason }),
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Kunde inte ändra status' }));
    throw new Error(extractErrorMessage(error));
   }

   return response.json();
  },
  onSuccess: (data) => {
   queryClient.invalidateQueries({ queryKey: ['workOrders'] });
   queryClient.setQueryData(getWorkOrderQueryKey(tenantId, data.id), data);
   toast.success('Status uppdaterad');
  },
  onError: (error) => {
   toast.error(extractErrorMessage(error));
  },
 });
}

/**
 * Hämtar foton för en arbetsorder
 */
export function useWorkOrderPhotos(workOrderId: string) {
 const { tenantId } = useTenant();

 const queryKey = getWorkOrderPhotosQueryKey(tenantId, workOrderId);

 return useQuery<WorkOrderPhoto[]>({
  queryKey,
  queryFn: async () => {
   if (!tenantId || !workOrderId) throw new Error('Tenant ID eller Work Order ID saknas');
   return fetchWorkOrderPhotos(`/api/work-orders/${workOrderId}/photos`);
  },
  enabled: !!tenantId && !!workOrderId,
 });
}

/**
 * Laddar upp ett foto till en arbetsorder
 */
export function useUploadWorkOrderPhoto(workOrderId: string) {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<WorkOrderPhoto, Error, File>({
  mutationFn: async (file) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const formData = new FormData();
   formData.append('file', file);

   const response = await fetch(`/api/work-orders/${workOrderId}/photos`, {
    method: 'POST',
    body: formData,
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Kunde inte ladda upp foto' }));
    throw new Error(extractErrorMessage(error));
   }

   return response.json();
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ 
    queryKey: getWorkOrderPhotosQueryKey(tenantId, workOrderId) 
   });
   toast.success('Foto uppladdat');
  },
  onError: (error) => {
   toast.error(extractErrorMessage(error));
  },
 });
}

/**
 * Tar bort ett foto från en arbetsorder
 */
export function useDeleteWorkOrderPhoto(workOrderId: string) {
 const queryClient = useQueryClient();
 const { tenantId } = useTenant();

 return useMutation<void, Error, string>({
  mutationFn: async (photoId) => {
   if (!tenantId) throw new Error('Tenant ID saknas');

   const response = await fetch(`/api/work-orders/${workOrderId}/photos/${photoId}`, {
    method: 'DELETE',
   });

   if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Kunde inte ta bort foto' }));
    throw new Error(extractErrorMessage(error));
   }
  },
  onSuccess: () => {
   queryClient.invalidateQueries({ 
    queryKey: getWorkOrderPhotosQueryKey(tenantId, workOrderId) 
   });
   toast.success('Foto borttaget');
  },
  onError: (error) => {
   toast.error(extractErrorMessage(error));
  },
 });
}
