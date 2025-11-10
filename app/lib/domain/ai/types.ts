// app/lib/domain/ai/types.ts
export type AiAssistantRole = 'project_assistant' | 'invoice_helper' | 'cost_analyzer' | 'general';

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface AiConversation {
  id: string;
  tenant_id: string;
  user_id: string;
  assistant_role: AiAssistantRole;
  messages: AiMessage[];
  context?: AiContext;
  created_at: Date;
  updated_at: Date;
}

export interface AiContext {
  tenant_id: string;
  user_id: string;
  project_id?: string;
  invoice_id?: string;
  // Injected business context
  current_project?: {
    id: string;
    name: string;
    budget: number;
    spent: number;
  };
  recent_invoices?: Array<{
    id: string;
    number: string;
    amount: number;
    status: string;
  }>;
  company_info?: {
    name: string;
    industry: string;
  };
}

export interface ChatCompletionRequest {
  conversation_id?: string;
  message: string;
  assistant_role: AiAssistantRole;
  context?: Partial<AiContext>;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  conversation_id: string;
  message: AiMessage;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost: number;
  };
}

export interface AiCacheEntry {
  key: string;
  response: string;
  tokens_saved: number;
  created_at: Date;
  expires_at: Date;
}

