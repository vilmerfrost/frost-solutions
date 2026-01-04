// lib/schemas/work-order.ts

import { z } from 'zod';

export const WorkOrderStatusEnum = z.enum([
 'new',
 'assigned',
 'in_progress',
 'awaiting_approval',
 'approved',
 'completed'
]);

export const PriorityEnum = z.enum(['critical', 'high', 'medium', 'low']);

export const CreateWorkOrderSchema = z.object({
 title: z.string().min(1, 'Titel krävs'),
 description: z.string().max(20000).optional().nullable(),
 project_id: z.string().uuid().nullable().optional(),
 assigned_to: z.string().uuid().nullable().optional(),
 priority: PriorityEnum.default('medium'),
 scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
 scheduled_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
 scheduled_end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional()
});

export const UpdateWorkOrderSchema = z.object({
 title: z.string().min(1).optional(),
 description: z.string().max(20000).optional().nullable(),
 project_id: z.string().uuid().nullable().optional(),
 assigned_to: z.string().uuid().nullable().optional(),
 priority: PriorityEnum.optional(),
 scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
 scheduled_start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
 scheduled_end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional()
}).refine((d) => Object.keys(d).length > 0, { message: 'Inga fält att uppdatera.' });

export const UpdateStatusSchema = z.object({
 to_status: WorkOrderStatusEnum,
 reason: z.string().max(1000).optional().nullable()
});

