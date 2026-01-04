// app/utils/mocks/ai.ts
/**
 * Mock data generators for AI
 * Based on Mistral AI recommendations
 */
import type { AIMessage } from '@/types/ai';

export function generateMockAiResponse(): AIMessage {
 const responses = [
  'Detta är ett mock AI-svar för testning.',
  'Jag kan hjälpa dig med fakturering och projektledning.',
  'Baserat på din fråga skulle jag rekommendera att kontakta support.',
 ];
 const response = responses[Math.floor(Math.random() * responses.length)];

 return {
  id: `ai-response-${Math.random().toString(36).substr(2, 9)}`,
  tenant_id: `tenant-${Math.random().toString(36).substr(2, 9)}`,
  conversation_id: `conversation-${Math.random().toString(36).substr(2, 9)}`,
  role: 'assistant',
  content: { text: response },
  token_count: Math.floor(Math.random() * 500) + 100,
  created_at: new Date().toISOString(),
 };
}

