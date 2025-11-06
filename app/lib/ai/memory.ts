/**
 * Conversation Memory Management
 * Handles conversation history, summaries, and context
 */

import { createAdminClient } from '@/utils/supabase/admin';
import { extractErrorMessage } from '@/lib/errorUtils';
import crypto from 'crypto';

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  intent?: string;
  tools_used?: any[];
  metadata?: Record<string, any>;
}

export interface Conversation {
  id: string;
  tenant_id: string;
  user_id?: string;
  title?: string;
  summary?: string;
  message_count: number;
  last_message_at: string;
}

const SUMMARY_INTERVAL = 10; // Summarize every 10 messages

/**
 * Get or create conversation
 */
export async function getOrCreateConversation(
  tenantId: string,
  userId?: string
): Promise<Conversation> {
  const admin = createAdminClient();
  
  // Try to find recent conversation (within last hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { data: existing } = await admin
    .from('ai_conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId || null)
    .gte('last_message_at', oneHourAgo)
    .order('last_message_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (existing) {
    return existing as Conversation;
  }
  
  // Create new conversation
  const { data: newConv, error } = await admin
    .from('ai_conversations')
    .insert({
      tenant_id: tenantId,
      user_id: userId || null,
      title: 'Ny konversation',
      message_count: 0,
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(extractErrorMessage(error));
  }
  
  return newConv as Conversation;
}

/**
 * Add message to conversation
 */
export async function addMessage(
  conversationId: string,
  message: ConversationMessage
): Promise<void> {
  const admin = createAdminClient();
  
  const { error } = await admin
    .from('ai_messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      intent: message.intent,
      tools_used: message.tools_used ? JSON.stringify(message.tools_used) : null,
      metadata: message.metadata ? JSON.stringify(message.metadata) : null,
    });
  
  if (error) {
    throw new Error(extractErrorMessage(error));
  }
  
  // Update conversation
  const { error: updateError } = await admin
    .from('ai_conversations')
    .update({
      message_count: admin.rpc('increment', { table_name: 'ai_conversations', column_name: 'message_count', id: conversationId }),
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
  
  // For now, use a simpler approach
  const { data: conv } = await admin
    .from('ai_conversations')
    .select('message_count')
    .eq('id', conversationId)
    .single();
  
  if (conv) {
    await admin
      .from('ai_conversations')
      .update({
        message_count: (conv.message_count || 0) + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }
}

/**
 * Get conversation messages
 */
export async function getConversationMessages(
  conversationId: string,
  limit: number = 50
): Promise<ConversationMessage[]> {
  const admin = createAdminClient();
  
  const { data, error } = await admin
    .from('ai_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);
  
  if (error) {
    throw new Error(extractErrorMessage(error));
  }
  
  return (data || []).map(msg => ({
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    intent: msg.intent || undefined,
    tools_used: msg.tools_used ? JSON.parse(msg.tools_used) : undefined,
    metadata: msg.metadata ? JSON.parse(msg.metadata) : undefined,
  }));
}

/**
 * Check if conversation needs summarization
 */
export async function shouldSummarize(conversationId: string): Promise<boolean> {
  const admin = createAdminClient();
  
  const { data: conv } = await admin
    .from('ai_conversations')
    .select('message_count')
    .eq('id', conversationId)
    .single();
  
  if (!conv) return false;
  
  return (conv.message_count || 0) % SUMMARY_INTERVAL === 0 && conv.message_count > 0;
}

/**
 * Create conversation summary
 */
export async function createSummary(
  conversationId: string,
  summaryText: string,
  messageRangeStart: number,
  messageRangeEnd: number
): Promise<void> {
  const admin = createAdminClient();
  
  const { error } = await admin
    .from('ai_conversation_summaries')
    .insert({
      conversation_id: conversationId,
      summary: summaryText,
      message_range_start: messageRangeStart,
      message_range_end: messageRangeEnd,
    });
  
  if (error) {
    throw new Error(extractErrorMessage(error));
  }
  
  // Update conversation summary
  await admin
    .from('ai_conversations')
    .update({ summary: summaryText })
    .eq('id', conversationId);
}

/**
 * Get conversation context (recent messages + summaries)
 */
export async function getConversationContext(
  conversationId: string,
  maxMessages: number = 20
): Promise<string> {
  const messages = await getConversationMessages(conversationId, maxMessages);
  const admin = createAdminClient();
  
  // Get summaries
  const { data: summaries } = await admin
    .from('ai_conversation_summaries')
    .select('summary, message_range_start, message_range_end')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  
  let context = '';
  
  if (summaries && summaries.length > 0) {
    context += 'Tidigare sammanfattningar:\n';
    summaries.forEach((sum: any) => {
      context += `- Meddelanden ${sum.message_range_start}-${sum.message_range_end}: ${sum.summary}\n`;
    });
    context += '\n';
  }
  
  context += 'Senaste meddelanden:\n';
  messages.slice(-maxMessages).forEach((msg, idx) => {
    context += `${msg.role}: ${msg.content}\n`;
  });
  
  return context;
}

