/**
 * AI Tool Definitions
 * Functions that the AI can call to perform actions
 */

import { z } from 'zod';
import { apiFetch } from '@/lib/http/fetcher';

export interface ToolDefinition {
 name: string;
 description: string;
 parameters: z.ZodSchema;
 handler: (params: any) => Promise<any>;
}

/**
 * Create invoice tool
 */
export const createInvoiceTool: ToolDefinition = {
 name: 'create_invoice',
 description: 'Skapar en faktura från ett projekt. Använd när användaren vill fakturera ett projekt.',
 parameters: z.object({
  project_id: z.string().uuid('Projekt-ID måste vara ett giltigt UUID'),
  rows: z.array(z.object({
   description: z.string(),
   quantity: z.number().positive(),
   unit_price: z.number().nonnegative(),
   vat: z.number().min(0).max(100).default(25),
  })).optional(),
  discounts: z.array(z.object({
   type: z.enum(['percentage', 'fixed']),
   value: z.number().nonnegative(),
   description: z.string().optional(),
  })).optional(),
 }),
 handler: async (params) => {
  return apiFetch('/api/invoices', {
   method: 'POST',
   body: JSON.stringify({
    project_id: params.project_id,
    rows: params.rows,
    discounts: params.discounts,
   }),
  });
 },
};

/**
 * Suggest KMA checklist tool
 */
export const suggestKMATool: ToolDefinition = {
 name: 'suggest_kma',
 description: 'Föreslår en KMA-checklista baserat på projekttyp. Använd när användaren frågar om säkerhet eller checklistor.',
 parameters: z.object({
  project_type: z.string().describe('Typ av projekt (t.ex. "elektriker", "rörmokare", "målare")'),
 }),
 handler: async (params) => {
  return apiFetch('/api/ai/suggest-kma-checklist', {
   method: 'POST',
   body: JSON.stringify({ project_type: params.project_type }),
  });
 },
};

/**
 * Create work order tool
 */
export const createWorkOrderTool: ToolDefinition = {
 name: 'create_work_order',
 description: 'Skapar en arbetsorder. Använd när användaren vill skapa en ny uppgift eller arbetsorder.',
 parameters: z.object({
  title: z.string().min(1, 'Titel krävs'),
  project_id: z.string().uuid('Projekt-ID måste vara ett giltigt UUID').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  photos: z.array(z.string()).optional().describe('Base64-encoded bilder'),
 }),
 handler: async (params) => {
  // TODO: Implement work order creation endpoint
  // For now, return a placeholder
  return {
   id: crypto.randomUUID(),
   title: params.title,
   project_id: params.project_id,
   priority: params.priority,
   status: 'pending',
  };
 },
};

/**
 * Find time entries tool
 */
export const findTimeEntriesTool: ToolDefinition = {
 name: 'find_time_entries',
 description: 'Hittar tidsrapporter för ett projekt eller datumintervall. Använd när användaren frågar om tid eller rapporter.',
 parameters: z.object({
  project_id: z.string().uuid('Projekt-ID måste vara ett giltigt UUID').optional(),
  date_range: z.object({
   start: z.string().describe('Startdatum (YYYY-MM-DD)'),
   end: z.string().describe('Slutdatum (YYYY-MM-DD)'),
  }).optional(),
 }),
 handler: async (params) => {
  const queryParams = new URLSearchParams();
  if (params.project_id) queryParams.append('project_id', params.project_id);
  if (params.date_range) {
   queryParams.append('start_date', params.date_range.start);
   queryParams.append('end_date', params.date_range.end);
  }
  
  return apiFetch(`/api/time-entries/list?${queryParams.toString()}`);
 },
};

/**
 * Predict budget tool
 */
export const predictBudgetTool: ToolDefinition = {
 name: 'predict_budget',
 description: 'Ger en budgetprognos för ett projekt. Använd när användaren frågar om budget eller ekonomi.',
 parameters: z.object({
  project_id: z.string().uuid('Projekt-ID måste vara ett giltigt UUID'),
 }),
 handler: async (params) => {
  return apiFetch('/api/ai/predict-budget', {
   method: 'POST',
   body: JSON.stringify({ project_id: params.project_id }),
  });
 },
};

/**
 * Identify material tool
 */
export const identifyMaterialTool: ToolDefinition = {
 name: 'identify_material',
 description: 'Identifierar material från en bild. Använd när användaren laddar upp en bild eller frågar om material.',
 parameters: z.object({
  image_base64: z.string().describe('Base64-encoded bild (utan data:image prefix)'),
 }),
 handler: async (params) => {
  return apiFetch('/api/ai/identify-material', {
   method: 'POST',
   body: JSON.stringify({ image_base64: params.image_base64 }),
  });
 },
};

/**
 * All available tools
 */
export const AVAILABLE_TOOLS: ToolDefinition[] = [
 createInvoiceTool,
 suggestKMATool,
 createWorkOrderTool,
 findTimeEntriesTool,
 predictBudgetTool,
 identifyMaterialTool,
];

/**
 * Get tool by name
 */
export function getTool(name: string): ToolDefinition | undefined {
 return AVAILABLE_TOOLS.find(tool => tool.name === name);
}

/**
 * Generate tool descriptions for Claude
 */
export function getToolDescriptions(): string {
 return AVAILABLE_TOOLS.map(tool => {
  const params = tool.parameters as z.ZodObject<any>;
  const shape = params.shape;
  const paramDescriptions = Object.entries(shape).map(([key, schema]: [string, any]) => {
   const description = schema._def?.description || '';
   const type = schema._def?.typeName || 'unknown';
   return ` - ${key} (${type}): ${description}`;
  }).join('\n');
  
  return `${tool.name}: ${tool.description}\nParametrar:\n${paramDescriptions}`;
 }).join('\n\n');
}

