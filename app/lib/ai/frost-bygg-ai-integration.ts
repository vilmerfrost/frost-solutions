/**
 * 🏗️ FROST BYGG AI INTEGRATION LIBRARY
 * 
 * Production-ready AI integration for Frost Bygg with optimized prompts
 * 
 * Features:
 * - Gemini 2.0 Flash (Vision) for OCR tasks
 * - Groq Llama 3.3 70B (Text) for summaries and insights
 * - Structured JSON output with Zod validation
 * - Retry logic and error handling
 * - Cost tracking (optional)
 * 
 * @module frost-bygg-ai-integration
 */

import { z } from 'zod';

// ============================================================================
// TYPES & SCHEMAS
// ============================================================================

/**
 * Invoice OCR Result Schema
 */
export const InvoiceOCRResultSchema = z.object({
 supplierName: z.string().min(1),
 supplierEmail: z.string().email().optional().nullable(),
 supplierPhone: z.string().optional().nullable(),
 supplierOrgNumber: z.string().optional().nullable(),
 invoiceNumber: z.string().min(1),
 invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
 subtotal: z.number().finite().nonnegative(),
 vatRate: z.number().min(0).max(100),
 vatAmount: z.number().finite().nonnegative(),
 totalAmount: z.number().finite().nonnegative(),
 currency: z.string().default('SEK'),
 lineItems: z.array(z.object({
  description: z.string().min(1),
  quantity: z.number().finite().nonnegative(),
  unit: z.string().min(1),
  unitPrice: z.number().finite().nonnegative(),
  total: z.number().finite().nonnegative(),
  taxRate: z.number().min(0).max(100).optional().nullable(),
 })).min(0),
 projectReference: z.string().optional().nullable(),
 projectNumber: z.string().optional().nullable(),
 ocrConfidence: z.number().min(0).max(100),
 extractedAt: z.string(),
 rawText: z.string().min(1),
});

export type InvoiceOCRResult = z.infer<typeof InvoiceOCRResultSchema>;

/**
 * Delivery Note OCR Result Schema
 */
export const DeliveryNoteOCRResultSchema = z.object({
 supplierName: z.string().min(1),
 supplierPhone: z.string().optional().nullable(),
 supplierEmail: z.string().email().optional().nullable(),
 deliveryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 referenceNumber: z.string().min(1),
 items: z.array(z.object({
  articleNumber: z.string().min(1),
  description: z.string().min(1),
  quantity: z.number().finite().nonnegative(),
  unit: z.string().min(1),
  unitPrice: z.number().finite().nonnegative().optional().nullable(),
  totalPrice: z.number().finite().nonnegative().optional().nullable(),
 })).min(1),
 projectReference: z.string().optional().nullable(),
 deliveryAddress: z.string().optional().nullable(),
 ocrConfidence: z.number().min(0).max(100),
 extractedAt: z.string(),
 rawOCRText: z.string().min(1),
});

export type DeliveryNoteOCRResult = z.infer<typeof DeliveryNoteOCRResultSchema>;

/**
 * Receipt OCR Result Schema
 */
export const ReceiptOCRResultSchema = z.object({
 merchantName: z.string().min(1),
 receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
 receiptNumber: z.string().optional().nullable(),
 totalAmount: z.number().finite().nonnegative(),
 currency: z.string().default('SEK'),
 items: z.array(z.object({
  description: z.string().min(1),
  quantity: z.number().finite().nonnegative().optional().nullable(),
  unitPrice: z.number().finite().nonnegative().optional().nullable(),
  total: z.number().finite().nonnegative(),
 })).min(0),
 vatAmount: z.number().finite().nonnegative().optional().nullable(),
 paymentMethod: z.string().optional().nullable(),
 ocrConfidence: z.number().min(0).max(100),
 extractedAt: z.string(),
 rawText: z.string().min(1),
});

export type ReceiptOCRResult = z.infer<typeof ReceiptOCRResultSchema>;

/**
 * ROT/RUT Summary Schema
 */
export const ROTRUTSummarySchema = z.object({
 summary: z.string().min(1),
 totalAmount: z.number().finite().nonnegative(),
 vatAmount: z.number().finite().nonnegative(),
 rotAmount: z.number().finite().nonnegative().optional().nullable(),
 rutAmount: z.number().finite().nonnegative().optional().nullable(),
 customerName: z.string().min(1),
 projectDescription: z.string().min(1),
 workPeriod: z.string().min(1),
 keyPoints: z.array(z.string()).min(1),
 generatedAt: z.string(),
});

export type ROTRUTSummary = z.infer<typeof ROTRUTSummarySchema>;

/**
 * Project Insights Schema
 */
export const ProjectInsightsSchema = z.object({
 projectName: z.string().min(1),
 currentStatus: z.string().min(1),
 budgetStatus: z.object({
  totalBudget: z.number().finite().nonnegative(),
  spent: z.number().finite().nonnegative(),
  remaining: z.number().finite().nonnegative(),
  percentageUsed: z.number().min(0).max(100),
 }),
 timelineStatus: z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  expectedCompletion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  isOnTrack: z.boolean(),
 }),
 risks: z.array(z.object({
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1),
  recommendation: z.string().min(1),
 })).min(0),
 recommendations: z.array(z.string()).min(1),
 generatedAt: z.string(),
});

export type ProjectInsights = z.infer<typeof ProjectInsightsSchema>;

/**
 * Payroll Validation Result Schema
 */
export const PayrollValidationResultSchema = z.object({
 isValid: z.boolean(),
 errors: z.array(z.object({
  field: z.string().min(1),
  message: z.string().min(1),
  severity: z.enum(['error', 'warning', 'info']),
 })).min(0),
 warnings: z.array(z.string()).min(0),
 obCalculations: z.object({
  kvall: z.number().finite().nonnegative(),
  natt: z.number().finite().nonnegative(),
  helg: z.number().finite().nonnegative(),
  totalOB: z.number().finite().nonnegative(),
 }).optional().nullable(),
 taxCalculations: z.object({
  grossSalary: z.number().finite().nonnegative(),
  taxRate: z.number().min(0).max(100),
  taxAmount: z.number().finite().nonnegative(),
  netSalary: z.number().finite().nonnegative(),
 }).optional().nullable(),
 validatedAt: z.string(),
});

export type PayrollValidationResult = z.infer<typeof PayrollValidationResultSchema>;

/**
 * Monthly Report Schema
 */
export const MonthlyReportSchema = z.object({
 month: z.string().regex(/^\d{4}-\d{2}$/),
 summary: z.string().min(1),
 totalRevenue: z.number().finite().nonnegative(),
 totalCosts: z.number().finite().nonnegative(),
 profit: z.number().finite(),
 projectsCompleted: z.number().int().nonnegative(),
 projectsActive: z.number().int().nonnegative(),
 topProjects: z.array(z.object({
  projectName: z.string().min(1),
  revenue: z.number().finite().nonnegative(),
  profit: z.number().finite(),
 })).min(0),
 keyMetrics: z.object({
  averageProjectProfit: z.number().finite(),
  employeeUtilization: z.number().min(0).max(100),
  customerSatisfaction: z.number().min(0).max(100).optional().nullable(),
 }),
 recommendations: z.array(z.string()).min(1),
 generatedAt: z.string(),
});

export type MonthlyReport = z.infer<typeof MonthlyReportSchema>;

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AIConfig {
 geminiApiKey?: string;
 groqApiKey?: string;
 enableCostTracking?: boolean;
 maxRetries?: number;
 retryDelayMs?: number;
}

const DEFAULT_CONFIG: Required<AIConfig> = {
 geminiApiKey: process.env.GEMINI_API_KEY || '',
 groqApiKey: process.env.GROQ_API_KEY || '',
 enableCostTracking: false,
 maxRetries: 3,
 retryDelayMs: 1000,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Retry function with exponential backoff
 */
async function retryWithBackoff<T>(
 fn: () => Promise<T>,
 maxRetries: number = 3,
 delayMs: number = 1000
): Promise<T> {
 let lastError: Error | null = null;
 
 for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
   return await fn();
  } catch (error) {
   lastError = error instanceof Error ? error : new Error(String(error));
   
   if (attempt < maxRetries - 1) {
    const delay = delayMs * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
   }
  }
 }
 
 throw lastError || new Error('Retry failed');
}

/**
 * Convert image buffer to base64
 */
function bufferToBase64(buffer: Buffer): string {
 return buffer.toString('base64');
}

/**
 * Get MIME type from buffer or filename
 */
function getMimeType(buffer: Buffer, filename?: string): string {
 if (filename) {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeTypes: Record<string, string> = {
   'pdf': 'application/pdf',
   'png': 'image/png',
   'jpg': 'image/jpeg',
   'jpeg': 'image/jpeg',
   'gif': 'image/gif',
   'webp': 'image/webp',
  };
  return mimeTypes[ext || ''] || 'application/octet-stream';
 }
 return 'application/octet-stream';
}

// ============================================================================
// GEMINI 2.0 FLASH (VISION) CLIENT
// ============================================================================

/**
 * Process image with Gemini 2.0 Flash Vision API
 */
async function callGeminiVision(
 imageBuffer: Buffer,
 prompt: string,
 apiKey: string,
 mimeType: string = 'image/png'
): Promise<string> {
 const base64Image = bufferToBase64(imageBuffer);
 
 const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
  {
   method: 'POST',
   headers: {
    'Content-Type': 'application/json',
   },
   body: JSON.stringify({
    contents: [
     {
      parts: [
       {
        text: prompt,
       },
       {
        inline_data: {
         mime_type: mimeType,
         data: base64Image,
        },
       },
      ],
     },
    ],
    generationConfig: {
     temperature: 0.1,
     topK: 32,
     topP: 1,
     maxOutputTokens: 8192,
     responseMimeType: 'application/json',
    },
   }),
  }
 );

 if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
 }

 const data = await response.json();
 
 if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
  throw new Error('Gemini API returned no content');
 }

 return data.candidates[0].content.parts[0].text;
}

// ============================================================================
// GROQ LLAMA 3.3 70B CLIENT
// ============================================================================

/**
 * Call Groq Llama 3.3 70B API
 */
async function callGroqLlama(
 prompt: string,
 apiKey: string,
 systemPrompt?: string
): Promise<string> {
 const response = await fetch(
  'https://api.groq.com/openai/v1/chat/completions',
  {
   method: 'POST',
   headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
   },
   body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: [
     ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
     { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 4096,
    response_format: { type: 'json_object' },
   }),
  }
 );

 if (!response.ok) {
  const errorText = await response.text();
  throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText}`);
 }

 const data = await response.json();
 
 if (!data.choices?.[0]?.message?.content) {
  throw new Error('Groq API returned no content');
 }

 return data.choices[0].message.content;
}

// ============================================================================
// OPTIMIZED PROMPTS
// ============================================================================

/**
 * Invoice OCR Prompt (Swedish context)
 */
const INVOICE_OCR_PROMPT = `Du är en expert på att läsa svenska fakturor. Extrahera all information från fakturan och returnera som JSON.

VIKTIGT:
- Returnera ALLTID giltig JSON, inga kommentarer eller extra text
- Använd svenska fältnamn där det är relevant
- Om ett fält saknas, sätt värdet till null
- Datum ska vara i format YYYY-MM-DD
- Belopp ska vara numeriska värden (inte strängar)
- Moms (VAT) ska vara procent (t.ex. 25 för 25%)
- Fakturanr kan vara "fakturanr", "fakturanummer", "invoice number" etc.
- Förfallodatum kan vara "förfallodatum", "betalningsdatum", "due date" etc.

Returnera JSON med följande struktur:
{
 "supplierName": "string",
 "supplierEmail": "string | null",
 "supplierPhone": "string | null",
 "supplierOrgNumber": "string | null",
 "invoiceNumber": "string",
 "invoiceDate": "YYYY-MM-DD",
 "dueDate": "YYYY-MM-DD | null",
 "subtotal": number,
 "vatRate": number (0-100),
 "vatAmount": number,
 "totalAmount": number,
 "currency": "SEK",
 "lineItems": [
  {
   "description": "string",
   "quantity": number,
   "unit": "string",
   "unitPrice": number,
   "total": number,
   "taxRate": number | null
  }
 ],
 "projectReference": "string | null",
 "projectNumber": "string | null",
 "ocrConfidence": number (0-100),
 "extractedAt": "ISO 8601 timestamp",
 "rawText": "fullständig text från fakturan"
}`;

/**
 * Delivery Note OCR Prompt (Swedish context)
 */
const DELIVERY_NOTE_OCR_PROMPT = `Du är en expert på att läsa svenska följesedlar (delivery notes). Extrahera all information och returnera som JSON.

VIKTIGT:
- Returnera ALLTID giltig JSON
- Följesedel = delivery note på svenska
- Om ett fält saknas, sätt värdet till null
- Datum ska vara i format YYYY-MM-DD
- Artiklar ska extraheras från tabeller eller listor

Returnera JSON med följande struktur:
{
 "supplierName": "string",
 "supplierPhone": "string | null",
 "supplierEmail": "string | null",
 "deliveryDate": "YYYY-MM-DD",
 "referenceNumber": "string",
 "items": [
  {
   "articleNumber": "string",
   "description": "string",
   "quantity": number,
   "unit": "string",
   "unitPrice": number | null,
   "totalPrice": number | null
  }
 ],
 "projectReference": "string | null",
 "deliveryAddress": "string | null",
 "ocrConfidence": number (0-100),
 "extractedAt": "ISO 8601 timestamp",
 "rawOCRText": "fullständig text från följesedeln"
}`;

/**
 * Receipt OCR Prompt
 */
const RECEIPT_OCR_PROMPT = `Du är en expert på att läsa kvitton. Extrahera all information och returnera som JSON.

VIKTIGT:
- Returnera ALLTID giltig JSON
- Om ett fält saknas, sätt värdet till null
- Datum ska vara i format YYYY-MM-DD

Returnera JSON med följande struktur:
{
 "merchantName": "string",
 "receiptDate": "YYYY-MM-DD",
 "receiptNumber": "string | null",
 "totalAmount": number,
 "currency": "SEK",
 "items": [
  {
   "description": "string",
   "quantity": number | null,
   "unitPrice": number | null,
   "total": number
  }
 ],
 "vatAmount": number | null,
 "paymentMethod": "string | null",
 "ocrConfidence": number (0-100),
 "extractedAt": "ISO 8601 timestamp",
 "rawText": "fullständig text från kvittot"
}`;

/**
 * ROT/RUT Summary Prompt (Swedish context)
 */
const ROT_RUT_SUMMARY_PROMPT = `Du är en expert på svenska ROT/RUT-avdrag. Skapa en professionell sammanfattning baserat på projektdata.

VIKTIGT:
- ROT = Renovering, Ombyggnad, Tillbyggnad (30% avdrag)
- RUT = Rengöring, Underhåll, Tvätt (30% avdrag, max 75,000 kr/år)
- Använd svenska terminologi
- Var tydlig med belopp och avdrag

Skapa en sammanfattning i JSON-format:
{
 "summary": "string (2-3 stycken)",
 "totalAmount": number,
 "vatAmount": number,
 "rotAmount": number | null,
 "rutAmount": number | null,
 "customerName": "string",
 "projectDescription": "string",
 "workPeriod": "string (t.ex. '2025-01-15 till 2025-03-20')",
 "keyPoints": ["string"],
 "generatedAt": "ISO 8601 timestamp"
}`;

/**
 * Project Insights Prompt
 */
const PROJECT_INSIGHTS_PROMPT = `Du är en projektledarexpert. Analysera projektdata och ge insikter.

VIKTIGT:
- Identifiera risker och möjligheter
- Ge konkreta rekommendationer
- Använd svenska terminologi

Returnera JSON:
{
 "projectName": "string",
 "currentStatus": "string",
 "budgetStatus": {
  "totalBudget": number,
  "spent": number,
  "remaining": number,
  "percentageUsed": number
 },
 "timelineStatus": {
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD | null",
  "expectedCompletion": "YYYY-MM-DD | null",
  "isOnTrack": boolean
 },
 "risks": [
  {
   "severity": "low | medium | high",
   "description": "string",
   "recommendation": "string"
  }
 ],
 "recommendations": ["string"],
 "generatedAt": "ISO 8601 timestamp"
}`;

/**
 * Payroll Validation Prompt (Swedish 2025 rules)
 */
const PAYROLL_VALIDATION_PROMPT = `Du är en expert på svenska löneberäkningar enligt 2025-regler. Validera lönedata.

VIKTIGT:
- OB Kväll: +50% (efter 18:00)
- OB Natt: +100% (efter 22:00)
- OB Helg: +50% (lördag/söndag)
- Skatt: 30% standard (kan variera)
- Arbetsgivaravgift: 31.42%
- Kontrollera att alla tider är korrekta
- Validera att OB-beräkningar är korrekta

Returnera JSON:
{
 "isValid": boolean,
 "errors": [
  {
   "field": "string",
   "message": "string",
   "severity": "error | warning | info"
  }
 ],
 "warnings": ["string"],
 "obCalculations": {
  "kvall": number,
  "natt": number,
  "helg": number,
  "totalOB": number
 } | null,
 "taxCalculations": {
  "grossSalary": number,
  "taxRate": number,
  "taxAmount": number,
  "netSalary": number
 } | null,
 "validatedAt": "ISO 8601 timestamp"
}`;

/**
 * Monthly Report Prompt
 */
const MONTHLY_REPORT_PROMPT = `Du är en ekonomiexpert. Skapa en månadsrapport baserat på projektdata.

VIKTIGT:
- Analysera intäkter, kostnader och vinst
- Identifiera trender och mönster
- Ge konkreta rekommendationer
- Använd svenska terminologi

Returnera JSON:
{
 "month": "YYYY-MM",
 "summary": "string (3-4 stycken)",
 "totalRevenue": number,
 "totalCosts": number,
 "profit": number,
 "projectsCompleted": number,
 "projectsActive": number,
 "topProjects": [
  {
   "projectName": "string",
   "revenue": number,
   "profit": number
  }
 ],
 "keyMetrics": {
  "averageProjectProfit": number,
  "employeeUtilization": number (0-100),
  "customerSatisfaction": number (0-100) | null
 },
 "recommendations": ["string"],
 "generatedAt": "ISO 8601 timestamp"
}`;

// ============================================================================
// MAIN API FUNCTIONS
// ============================================================================

/**
 * Process invoice with OCR using Gemini 2.0 Flash
 */
export async function processInvoiceOCR(
 imageBuffer: Buffer,
 filename?: string,
 config?: AIConfig
): Promise<InvoiceOCRResult> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.geminiApiKey) {
  throw new Error('GEMINI_API_KEY is required for invoice OCR');
 }

 const mimeType = getMimeType(imageBuffer, filename);
 const prompt = INVOICE_OCR_PROMPT;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGeminiVision(imageBuffer, prompt, cfg.geminiApiKey, mimeType);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 // Validate with Zod
 const validated = InvoiceOCRResultSchema.parse(result);
 
 return validated;
}

/**
 * Process delivery note with OCR using Gemini 2.0 Flash
 */
export async function processDeliveryNoteOCR(
 imageBuffer: Buffer,
 filename?: string,
 config?: AIConfig
): Promise<DeliveryNoteOCRResult> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.geminiApiKey) {
  throw new Error('GEMINI_API_KEY is required for delivery note OCR');
 }

 const mimeType = getMimeType(imageBuffer, filename);
 const prompt = DELIVERY_NOTE_OCR_PROMPT;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGeminiVision(imageBuffer, prompt, cfg.geminiApiKey, mimeType);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 const validated = DeliveryNoteOCRResultSchema.parse(result);
 
 return validated;
}

/**
 * Process receipt with OCR using Gemini 2.0 Flash
 */
export async function processReceiptOCR(
 imageBuffer: Buffer,
 filename?: string,
 config?: AIConfig
): Promise<ReceiptOCRResult> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.geminiApiKey) {
  throw new Error('GEMINI_API_KEY is required for receipt OCR');
 }

 const mimeType = getMimeType(imageBuffer, filename);
 const prompt = RECEIPT_OCR_PROMPT;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGeminiVision(imageBuffer, prompt, cfg.geminiApiKey, mimeType);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 const validated = ReceiptOCRResultSchema.parse(result);
 
 return validated;
}

/**
 * Generate ROT/RUT summary using Groq Llama 3.3 70B
 */
export async function generateROTRUTSummary(
 projectData: {
  customerName: string;
  projectDescription: string;
  workPeriod: string;
  totalAmount: number;
  vatAmount: number;
  rotAmount?: number;
  rutAmount?: number;
 },
 config?: AIConfig
): Promise<ROTRUTSummary> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.groqApiKey) {
  throw new Error('GROQ_API_KEY is required for ROT/RUT summary generation');
 }

 const prompt = `Skapa en ROT/RUT-sammanfattning för följande projekt:

Kund: ${projectData.customerName}
Projektbeskrivning: ${projectData.projectDescription}
Arbetsperiod: ${projectData.workPeriod}
Totalt belopp: ${projectData.totalAmount} SEK
Moms: ${projectData.vatAmount} SEK
${projectData.rotAmount ? `ROT-belopp: ${projectData.rotAmount} SEK` : ''}
${projectData.rutAmount ? `RUT-belopp: ${projectData.rutAmount} SEK` : ''}

${ROT_RUT_SUMMARY_PROMPT}`;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGroqLlama(prompt, cfg.groqApiKey);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 const validated = ROTRUTSummarySchema.parse(result);
 
 return validated;
}

/**
 * Generate project insights using Groq Llama 3.3 70B
 */
export async function generateProjectInsights(
 projectData: {
  projectName: string;
  currentStatus: string;
  totalBudget: number;
  spent: number;
  startDate: string;
  endDate?: string;
  expectedCompletion?: string;
  risks?: Array<{ severity: string; description: string }>;
 },
 config?: AIConfig
): Promise<ProjectInsights> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.groqApiKey) {
  throw new Error('GROQ_API_KEY is required for project insights');
 }

 const prompt = `Analysera följande projektdata och ge insikter:

Projektnamn: ${projectData.projectName}
Nuvarande status: ${projectData.currentStatus}
Budget: ${projectData.totalBudget} SEK
Spenderat: ${projectData.spent} SEK
Startdatum: ${projectData.startDate}
${projectData.endDate ? `Slutdatum: ${projectData.endDate}` : ''}
${projectData.expectedCompletion ? `Förväntad slutföring: ${projectData.expectedCompletion}` : ''}
${projectData.risks?.length ? `Risker: ${JSON.stringify(projectData.risks)}` : ''}

${PROJECT_INSIGHTS_PROMPT}`;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGroqLlama(prompt, cfg.groqApiKey);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 const validated = ProjectInsightsSchema.parse(result);
 
 return validated;
}

/**
 * Validate payroll data using Groq Llama 3.3 70B (Swedish 2025 rules)
 */
export async function validatePayroll(
 payrollData: {
  employeeName: string;
  hours: number;
  hourlyRate: number;
  obKvall?: number;
  obNatt?: number;
  obHelg?: number;
  taxRate?: number;
 },
 config?: AIConfig
): Promise<PayrollValidationResult> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.groqApiKey) {
  throw new Error('GROQ_API_KEY is required for payroll validation');
 }

 const prompt = `Validera följande lönedata enligt svenska 2025-regler:

Anställd: ${payrollData.employeeName}
Timmar: ${payrollData.hours}
Timlön: ${payrollData.hourlyRate} SEK
OB Kväll: ${payrollData.obKvall || 0} timmar
OB Natt: ${payrollData.obNatt || 0} timmar
OB Helg: ${payrollData.obHelg || 0} timmar
Skattesats: ${payrollData.taxRate || 30}%

${PAYROLL_VALIDATION_PROMPT}`;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGroqLlama(prompt, cfg.groqApiKey);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 const validated = PayrollValidationResultSchema.parse(result);
 
 return validated;
}

/**
 * Generate monthly report using Groq Llama 3.3 70B
 */
export async function generateMonthlyReport(
 reportData: {
  month: string;
  totalRevenue: number;
  totalCosts: number;
  projectsCompleted: number;
  projectsActive: number;
  projectDetails: Array<{
   projectName: string;
   revenue: number;
   profit: number;
  }>;
  employeeUtilization?: number;
  customerSatisfaction?: number;
 },
 config?: AIConfig
): Promise<MonthlyReport> {
 const cfg = { ...DEFAULT_CONFIG, ...config };
 
 if (!cfg.groqApiKey) {
  throw new Error('GROQ_API_KEY is required for monthly report generation');
 }

 const prompt = `Skapa en månadsrapport för följande data:

Månad: ${reportData.month}
Totala intäkter: ${reportData.totalRevenue} SEK
Totala kostnader: ${reportData.totalCosts} SEK
Färdiga projekt: ${reportData.projectsCompleted}
Aktiva projekt: ${reportData.projectsActive}
Projektdetaljer: ${JSON.stringify(reportData.projectDetails)}
${reportData.employeeUtilization ? `Anställdutilisering: ${reportData.employeeUtilization}%` : ''}
${reportData.customerSatisfaction ? `Kundnöjdhet: ${reportData.customerSatisfaction}%` : ''}

${MONTHLY_REPORT_PROMPT}`;

 const result = await retryWithBackoff(
  async () => {
   const jsonText = await callGroqLlama(prompt, cfg.groqApiKey);
   return JSON.parse(jsonText);
  },
  cfg.maxRetries,
  cfg.retryDelayMs
 );

 const validated = MonthlyReportSchema.parse(result);
 
 return validated;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
 processInvoiceOCR,
 processDeliveryNoteOCR,
 processReceiptOCR,
 generateROTRUTSummary,
 generateProjectInsights,
 validatePayroll,
 generateMonthlyReport,
};

