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
     switch (n.type) {
      case 'success':
       toast.success(n.message);
       break;
      case 'error':
       toast.error(n.message);
       break;
      case 'warning':
       toast.warning(n.message);
       break;
      default:
       toast.info(n.message);
       break;
     }

     setShownToasts((prev) => new Set(prev).add(n.id));
     markAsRead(n.id);
    }
   });
 }, [notifications, shownToasts, markAsRead]);

 // Don't show connection indicator - it's distracting and often shows "disconnected" incorrectly
 // The sync status in the sidebar is sufficient for connection feedback
 return (
  <>
   <Toaster position="top-right" richColors />
  </>
 );
}

