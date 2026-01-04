import { z } from 'zod';

export const periodListQuery = z.object({
 status: z.string().optional(),
 start: z.string().optional(),
 end: z.string().optional()
});

export const periodCreateBody = z.object({
 startDate: z.string(),
 endDate: z.string(),
 format: z.enum(['fortnox-paxml', 'visma-csv'])
});

export const lockBody = z.object({}); // Empty for now, may add force flag later

