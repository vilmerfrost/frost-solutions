// app/components/workflows/WorkflowNotifications.tsx

/**
 * Workflow Notifications Component
 * Based on Gemini implementation
 */

'use client';

import { Toaster } from 'sonner';
import { useWorkflowStore } from '@/lib/store/workflowStore';
import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from '@/lib/toast';

export function WorkflowNotifications() {
  const notifications = useWorkflowStore((s) => s.notifications);
  const connection = useWorkflowStore((s) => s.connection);
  const markAsRead = useWorkflowStore((s) => s.markAsRead);

  // Håll koll på vilka toasts vi redan har visat
  const [shownToasts, setShownToasts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Visa bara de 5 senaste, olästa notiserna som toasts
    notifications
      .filter((n) => !n.read)
      .slice(0, 5)
      .forEach((n) => {
        if (!shownToasts.has(n.id)) {
          const options = {
            id: n.id,
            duration: 10000,
          };

          switch (n.type) {
            case 'success':
              toast.success(n.message, options);
              break;
            case 'error':
              toast.error(n.message, options);
              break;
            case 'warning':
              toast.warning(n.message, options);
              break;
            default:
              toast.info(n.message, options);
              break;
          }

          setShownToasts((prev) => new Set(prev).add(n.id));
          markAsRead(n.id);
        }
      });
  }, [notifications, shownToasts, markAsRead]);

  return (
    <>
      <Toaster position="top-right" richColors />
      {/* Global anslutningsindikator */}
      <div className="fixed bottom-4 right-4 z-50">
        {connection === 'connected' && (
          <span className="flex items-center text-xs text-green-600 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-full shadow-sm">
            <Wifi className="h-4 w-4 mr-1" /> Ansluten
          </span>
        )}
        {connection === 'disconnected' && (
          <span className="flex items-center text-xs text-red-600 bg-red-100 dark:bg-red-900/30 px-3 py-2 rounded-full shadow-sm">
            <WifiOff className="h-4 w-4 mr-1" /> Frånkopplad
          </span>
        )}
        {connection === 'reconnecting' && (
          <span className="flex items-center text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-2 rounded-full shadow-sm animate-pulse">
            <WifiOff className="h-4 w-4 mr-1" /> Återansluter...
          </span>
        )}
      </div>
    </>
  );
}

