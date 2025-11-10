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
