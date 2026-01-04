// app/components/ai/AiChatBubble.tsx
'use client';

import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import type { AIMessage } from '@/types/ai';
import { User, Bot } from 'lucide-react';

interface AiChatBubbleProps {
 message: AIMessage;
 isUser: boolean;
 className?: string;
}

export function AiChatBubble({ message, isUser, className }: AiChatBubbleProps) {
 const bubbleStyles = isUser
  ? 'bg-blue-600 text-white rounded-br-none ml-auto'
  : 'bg-gray-200 text-gray-900 rounded-tl-none mr-auto dark:bg-gray-700 dark:text-white';

 const content = typeof message.content === 'string' 
  ? message.content 
  : message.content?.text || '';

 const timeString = new Date(message.created_at).toLocaleTimeString('sv-SE', {
  hour: '2-digit',
  minute: '2-digit',
 });

 return (
  <div className={cn('flex w-full gap-3', isUser ? 'justify-end' : 'justify-start', className)}>
   {!isUser && (
    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
     <Bot className="w-5 h-5 text-white" />
    </div>
   )}

   <div
    className={cn(
     'max-w-xl p-3 my-1 rounded-[8px] shadow-md text-sm break-words',
     bubbleStyles
    )}
    role="log"
    aria-live="polite"
   >
    {isUser ? (
     <p className="whitespace-pre-wrap">{content}</p>
    ) : (
     <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown>{content}</ReactMarkdown>
     </div>
    )}

    <p
     className={cn(
      'text-xs mt-1 text-right',
      isUser ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'
     )}
    >
     {timeString}
    </p>
   </div>

   {isUser && (
    <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center flex-shrink-0">
     <User className="w-5 h-5 text-white" />
    </div>
   )}
  </div>
 );
}

