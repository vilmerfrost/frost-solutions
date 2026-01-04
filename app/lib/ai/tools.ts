/**
 * AI Tool Definitions
 * Functions that the AI can call to perform actions
 */

import { z } from 'zod';

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
  const response = await fetch('/api/invoices', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    project_id: params.project_id,
    rows: params.rows,
    discounts: params.discounts,
   }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({ error: 'Kunde inte skapa faktura' }));
   throw new Error(error.error || 'Kunde inte skapa faktura');
  }
  return await response.json();
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
  const response = await fetch('/api/ai/suggest-kma-checklist', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ project_type: params.project_type }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({ error: 'Kunde inte generera KMA-checklista' }));
   throw new Error(error.error || 'Kunde inte generera KMA-checklista');
  }
  return await response.json();
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
  
  const response = await fetch(`/api/time-entries/list?${queryParams.toString()}`);
  if (!response.ok) {
   const error = await response.json().catch(() => ({ error: 'Kunde inte hämta tidsrapporter' }));
   throw new Error(error.error || 'Kunde inte hämta tidsrapporter');
  }
  return await response.json();
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
  const response = await fetch('/api/ai/predict-budget', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ project_id: params.project_id }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({ error: 'Kunde inte generera budgetprognos' }));
   throw new Error(error.error || 'Kunde inte generera budgetprognos');
  }
  return await response.json();
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
  const response = await fetch('/api/ai/identify-material', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({ image_base64: params.image_base64 }),
  });
  if (!response.ok) {
   const error = await response.json().catch(() => ({ error: 'Kunde inte identifiera material' }));
   throw new Error(error.error || 'Kunde inte identifiera material');
  }
  return await response.json();
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

