// app/hooks/useStreamingChat.ts
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { AIMessage } from '@/types/ai';

interface UseStreamingChatOptions {
 onMessage?: (message: AIMessage) => void;
 onComplete?: (message: AIMessage) => void;
 onError?: (error: Error) => void;
}

export function useStreamingChat(options: UseStreamingChatOptions = {}) {
 const [isStreaming, setIsStreaming] = useState(false);
 const [currentMessage, setCurrentMessage] = useState<AIMessage | null>(null);
 const abortControllerRef = useRef<AbortController | null>(null);

 const sendMessage = useCallback(
  async (request: {
   message: string;
   pageContext?: string;
   pageData?: Record<string, unknown>;
   conversationId?: string;
   stream?: boolean;
  }) => {
   // Create abort controller for cancellation
   abortControllerRef.current = new AbortController();
   setIsStreaming(true);

   const messageId = crypto.randomUUID();
   const message: AIMessage = {
    id: messageId,
    tenant_id: '', // Will be set by backend
    conversation_id: request.conversationId || '',
    role: 'assistant',
    content: { text: '' },
    token_count: 0,
    created_at: new Date().toISOString(),
   };

   setCurrentMessage(message);

   try {
    const response = await fetch('/api/ai/chat', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ ...request, stream: true }),
     signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
     throw new Error(`HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
     throw new Error('No response body');
    }

    let fullContent = '';

    while (true) {
     const { done, value } = await reader.read();
     if (done) break;

     const chunk = decoder.decode(value);
     const lines = chunk.split('\n');

     for (const line of lines) {
      if (line.startsWith('data: ')) {
       const data = line.slice(6);
       if (data === '[DONE]') {
        const finalMessage: AIMessage = {
         ...message,
         content: { text: fullContent },
        };
        setCurrentMessage(finalMessage);
        options.onComplete?.(finalMessage);
        break;
       }

       try {
        const parsed = JSON.parse(data);
        fullContent += parsed.content || '';
        const updatedMessage: AIMessage = {
         ...message,
         content: { text: fullContent },
        };
        setCurrentMessage(updatedMessage);
        options.onMessage?.(updatedMessage);
       } catch (e) {
        // Invalid JSON, skip
       }
      }
     }
    }
   } catch (error) {
    if (error instanceof Error) {
     if (error.name === 'AbortError') {
      console.log('Streaming cancelled');
     } else {
      options.onError?.(error);
     }
    }
   } finally {
    setIsStreaming(false);
    setCurrentMessage(null);
    abortControllerRef.current = null;
   }
  },
  [options]
 );

 const cancelStreaming = useCallback(() => {
  if (abortControllerRef.current) {
   abortControllerRef.current.abort();
  }
 }, []);

 useEffect(() => {
  return () => {
   abortControllerRef.current?.abort();
  };
 }, []);

 return {
  sendMessage,
  cancelStreaming,
  isStreaming,
  currentMessage,
 };
}

