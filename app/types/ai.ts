// app/types/ai.ts
export type AIMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIMessage {
 id: string;
 tenant_id: string;
 conversation_id: string;
 role: AIMessageRole;
 content: { text?: string; parts?: unknown[]; tool_calls?: unknown[] };
 token_count: number;
 created_at: string;
}

export interface AIConversation {
 id: string;
 tenant_id: string;
 title?: string;
 created_by: string;
 token_used: number;
 created_at: string;
 updated_at: string;
}

export interface AIResponseCache {
 id: string;
 tenant_id: string;
 cache_key: string;
 response: unknown;
 token_saved: number;
 expires_at: string;
 created_at: string;
}

// Budget Prediction Types
export interface BudgetPrediction {
 currentSpend: number;
 budgetRemaining: number;
 currentProgress: number;
 predictedFinal: number;
 riskLevel: 'low' | 'medium' | 'high';
 suggestions: string[];
 confidence: 'low' | 'medium' | 'high';
}

// Invoice Suggestion Types
export interface InvoiceRow {
 description: string;
 quantity: number;
 unitPrice: number;
 vat: number;
 amount: number;
}

export interface InvoiceSuggestion {
 totalAmount: number;
 suggestedDiscount: number;
 invoiceRows: InvoiceRow[];
 notes: string;
 confidence: 'low' | 'medium' | 'high';
}

// Project Plan Types
export interface ProjectPhase {
 name: string;
 duration: number;
 resources: number;
 description: string;
 order: number;
}

export interface ProjectPlan {
 phases: ProjectPhase[];
 totalDays: number;
 bufferDays: number;
 riskFactors: string[];
 recommendedTeamSize: number;
 confidenceLevel: 'low' | 'medium' | 'high';
}

// KMA (Quality, Environment, Safety) Types
export interface KmaItem {
 title: string;
 category: string;
 requiresPhoto: boolean;
 description: string;
 order: number;
}

// Material Identification Types
export interface MaterialAlternative {
 name: string;
 confidence: number;
}

export interface SupplierItem {
 name: string;
 sku?: string;
 price?: number;
 supplier?: string;
}

export interface MaterialResult {
 name: string;
 confidence: number;
 category: string;
 supplierItems: SupplierItem[];
 alternatives: MaterialAlternative[];
}
