// app/types/work-orders.ts

import type { WorkOrderStatus, WorkOrderPriority } from '@/lib/work-order-state-machine';

// Re-export for convenience
export type { WorkOrderStatus, WorkOrderPriority };

export interface WorkOrder {
 id: string;
 tenant_id: string;
 number: string;
 title: string;
 description: string | null;
 project_id: string | null;
 assigned_to: string | null;
 created_by: string;
 status: WorkOrderStatus;
 priority: WorkOrderPriority;
 scheduled_date: string | null;
 scheduled_start_time: string | null;
 scheduled_end_time: string | null;
 completed_at: string | null;
 approved_at: string | null;
 approved_by: string | null;
 created_at: string;
 updated_at: string;
 // Enriched fields (from API joins)
 project?: { id: string; name: string } | null;
 assigned?: { id: string; full_name: string } | null;
 photos_count?: number;
 photos?: WorkOrderPhoto[];
}

export interface WorkOrderPhoto {
 id: string;
 work_order_id: string;
 file_path: string;
 thumbnail_path: string | null;
 file_size_bytes: number | null;
 mime_type: string | null;
 uploaded_by: string;
 uploaded_at: string;
 // Signed URLs (from API)
 url?: string | null;
 thumbnail_url?: string | null;
}

export interface WorkOrderFilters {
 status?: WorkOrderStatus;
 priority?: WorkOrderPriority;
 project_id?: string;
 assigned_to?: string;
 limit?: number;
 offset?: number;
}

export interface CreateWorkOrderRequest {
 title: string;
 description?: string | null;
 project_id?: string | null;
 assigned_to?: string | null;
 priority?: WorkOrderPriority;
 scheduled_date?: string | null;
 scheduled_start_time?: string | null;
 scheduled_end_time?: string | null;
}

export interface UpdateWorkOrderRequest {
 title?: string;
 description?: string | null;
 project_id?: string | null;
 assigned_to?: string | null;
 priority?: WorkOrderPriority;
 scheduled_date?: string | null;
 scheduled_start_time?: string | null;
 scheduled_end_time?: string | null;
}

export interface UpdateStatusRequest {
 to_status: WorkOrderStatus;
 reason?: string | null;
}
