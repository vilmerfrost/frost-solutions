import { Sparkles } from 'lucide-react';

export function AIBadge({ text = 'AI Förslag' }: { text?: string }) {
 return (
  <div className="flex items-center gap-2">
   <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
   <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{text}</span>
  </div>
 );
}

