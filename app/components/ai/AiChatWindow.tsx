// app/components/ai/AiChatWindow.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStreamingChat } from '@/hooks/useStreamingChat';
import { AiChatBubble } from './AiChatBubble';
import { AiTypingIndicator } from './AiTypingIndicator';
import { Loader2 } from 'lucide-react';
import { detectPromptInjection, sanitizeUserInput } from '@/lib/ai/security-guard';
import { toast } from '@/lib/toast';
import type { AIMessage } from '@/types/ai';

interface AiChatWindowProps {
  open: boolean;
  onClose: () => void;
  tenantId?: string;
  pageContext?: string;
  pageData?: Record<string, unknown>;
}

export function AiChatWindow({
  open,
  onClose,
  tenantId,
  pageContext = '',
  pageData = {},
}: AiChatWindowProps) {
  const { sendMessage, isStreaming, currentMessage, cancelStreaming } = useStreamingChat();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentMessage]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const trimmedInput = input.trim();
    setInput('');

    // Security check
    const securityCheck = detectPromptInjection(trimmedInput);
    if (securityCheck.isInjection) {
      toast.error('Ditt meddelande innehåller ogiltigt innehåll');
      return;
    }

    // Sanitize input
    const sanitizedMessage = sanitizeUserInput(trimmedInput);

    // Add user message
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      tenant_id: tenantId || '',
      conversation_id: '',
      role: 'user',
      content: { text: sanitizedMessage },
      token_count: 0,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      await sendMessage({
        message: sanitizedMessage,
        pageContext,
        pageData,
        stream: true,
      });

      // Add AI response when streaming completes
      if (currentMessage) {
        setMessages((prev) => [...prev, currentMessage]);
      }
    } catch (error) {
      toast.error('Kunde inte skicka meddelande');
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          tenant_id: tenantId || '',
          conversation_id: '',
          role: 'assistant',
          content: { text: 'Något gick fel. Försök igen.' },
          token_count: 0,
          created_at: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title="Frost AI-assistent">
      <div className="flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Hej! Hur kan jag hjälpa dig?</h3>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Jag kan hjälpa dig med projekt, fakturor, kostnadsanalyser och mycket mer.
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <AiChatBubble
                  key={message.id}
                  message={message}
                  isUser={message.role === 'user'}
                />
              ))}
              {isStreaming && currentMessage && (
                <AiChatBubble message={currentMessage} isUser={false} />
              )}
              {isStreaming && !currentMessage && <AiTypingIndicator />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t p-4 space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Skriv ett meddelande..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isStreaming}
              className="flex-1"
            />
            <Button onClick={handleSend} disabled={isStreaming || !input.trim()}>
              {isStreaming ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Skickar...
                </>
              ) : (
                'Skicka'
              )}
            </Button>
            {isStreaming && (
              <Button onClick={cancelStreaming} variant="outline">
                Avbryt
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Tryck <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Enter</kbd> för att skicka,
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded ml-1">Shift+Enter</kbd> för ny rad
          </p>
        </div>
      </div>
    </Dialog>
  );
}

