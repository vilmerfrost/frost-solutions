// lib/validation/scheduling.ts
import { z } from 'zod';

export const isoDateTime = z.string().datetime(); // ISO 8601
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const createScheduleSchema = z.object({
 employee_id: z.string().uuid(),
 project_id: z.string().uuid(),
 start_time: isoDateTime,
 end_time: isoDateTime,
 status: z.enum(['scheduled','confirmed','completed','cancelled']).optional(),
 shift_type: z.enum(['day', 'night', 'evening', 'weekend', 'other']).optional(),
 transport_time_minutes: z.number().int().min(0).max(480).optional(), // Max 8 hours transport
 notes: z.string().max(10_000).optional()
});

export const updateScheduleSchema = z.object({
 start_time: isoDateTime.optional(),
 end_time: isoDateTime.optional(),
 status: z.enum(['scheduled','confirmed','completed','cancelled']).optional(),
 shift_type: z.enum(['day', 'night', 'evening', 'weekend', 'other']).optional(),
 transport_time_minutes: z.number().int().min(0).max(480).optional(),
 notes: z.string().max(10_000).optional(),
 employee_id: z.string().uuid().optional(), // Allow changing employee on drag
 project_id: z.string().uuid().optional(), // Allow changing project
}).refine(v => v.start_time || v.end_time || v.status || v.shift_type !== undefined || v.transport_time_minutes !== undefined || v.notes || v.employee_id || v.project_id, {
 message: 'No fields to update'
});

export const createAbsenceSchema = z.object({
 employee_id: z.string().uuid(),
 start_date: isoDate,
 end_date: isoDate,
 type: z.enum(['vacation','sick','other']),
 reason: z.string().max(10_000).optional()
});

export const updateAbsenceSchema = z.object({
 start_date: isoDate.optional(),
 end_date: isoDate.optional(),
 type: z.enum(['vacation','sick','other']).optional(),
 status: z.enum(['pending','approved','rejected']).optional(),
 reason: z.string().max(10_000).optional()
}).refine(v => v.start_date || v.end_date || v.type || v.status || v.reason, {
 message: 'No fields to update'
});
