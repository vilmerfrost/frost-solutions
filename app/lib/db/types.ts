// app/lib/db/types.ts
// Type definitions for IndexedDB

import type { WorkOrderStatus, WorkOrderPriority } from '@/lib/work-order-state-machine';

/**
 * Local work order stored in IndexedDB
 * Matches server schema but with snake_case for consistency
 */
export type LocalWorkOrder = {
 id: string;       // server UUID eller client-temp-id (prefixed 'tmp_...')
 tenant_id: string;
 number?: string | null;
 title: string;
 description?: string | null;
 project_id?: string | null;
 assigned_to?: string | null;
 created_by?: string;
 status: WorkOrderStatus;
 priority: WorkOrderPriority;
 scheduled_date?: string | null;    // 'YYYY-MM-DD'
 scheduled_start_time?: string | null; // 'HH:mm:ss'
 scheduled_end_time?: string | null;
 completed_at?: string | null;
 approved_at?: string | null;
 approved_by?: string | null;
 created_at: string;   // ISO
 updated_at: string;   // ISO
 deleted_at?: string | null;
 isSynced?: boolean;   // lokalt flagg
};

/**
 * Sync queue item for offline changes
 */
export type SyncQueueItem = {
 id?: number;       // Auto-increment primary key
 tenant_id: string;
 workOrderId: string;  // kan vara tmp-id
 action: 'create' | 'update' | 'delete';
 payload: Partial<LocalWorkOrder>; // endast diff
 createdAt: number;   // Unix timestamp
 attempts: number;
 lastAttempt?: number | null;
 isSynced: boolean;
 client_change_id: string; // idempotens
};

