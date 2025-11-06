// app/types/ai.ts

export type RiskLevel = 'low' | 'medium' | 'high';
export type Confidence = 'low' | 'medium' | 'high';

export interface BudgetPrediction {
  currentSpend: number;
  budgetRemaining: number;
  currentProgress: number;  // 0..100
  predictedFinal: number;
  riskLevel: RiskLevel;
  suggestions: string[];
  confidence: Confidence;
}

export interface MaterialResult {
  name: string;
  confidence: number; // 0..100
  category: string;
  supplierItems: Array<{ id: string; name: string; price: number; supplier: string }>;
  alternatives: Array<{ name: string; confidence: number }>;
}

export interface KmaItem {
  title: string;
  category: string;
  requiresPhoto: boolean;
  description: string;
  order: number;
}

export interface InvoiceSuggestion {
  totalAmount: number;
  suggestedDiscount: number;
  invoiceRows: Array<{ description: string; quantity: number; unitPrice: number; vat: number; amount: number }>;
  notes: string;
  confidence: Confidence;
}

export interface ProjectPlan {
  phases: Array<{ name: string; duration: number; resources: number; description: string; order: number }>;
  totalDays: number;
  bufferDays: number;
  riskFactors: string[];
  recommendedTeamSize: number;
  confidenceLevel: Confidence;
}

