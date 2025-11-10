// app/components/ai/AiAssistant.tsx
'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AiChatWindow } from './AiChatWindow';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AiAssistantProps {
  tenantId?: string;
  pageContext?: string;
  pageData?: Record<string, unknown>;
}

export function AiAssistant({ tenantId, pageContext, pageData }: AiAssistantProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Öppna AI-assistent"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-4 right-4 z-50',
          'w-14 h-14 rounded-full shadow-2xl',
          'bg-gradient-to-br from-purple-500 to-pink-600',
          'flex items-center justify-center',
          'text-white hover:scale-110 transition-transform',
          'focus:outline-none focus:ring-4 focus:ring-purple-300'
        )}
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      <AiChatWindow
        open={open}
        onClose={() => setOpen(false)}
        tenantId={tenantId}
        pageContext={pageContext}
        pageData={pageData}
      />
    </>
  );
}

