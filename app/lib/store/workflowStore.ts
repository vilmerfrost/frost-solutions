// app/lib/store/workflowStore.ts

/**
 * Zustand Store for Workflow State
 * Based on Gemini implementation
 */

import { create } from 'zustand';
import type { Notification } from '@/types/workflow';

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface WorkflowState {
 connection: ConnectionStatus;
 setConnection: (status: ConnectionStatus) => void;
 notifications: Notification[];
 addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
 markAsRead: (id: string) => void;
 clearNotifications: () => void;
}

/**
 * Global Zustand store för UI-state som inte hör hemma i React Query,
 * såsom anslutningsstatus och notis-listan.
 */
export const useWorkflowStore = create<WorkflowState>((set) => ({
 connection: 'disconnected',
 setConnection: (status) => set({ connection: status }),

 notifications: [],

 addNotification: (notification) =>
  set((state) => ({
   notifications: [
    {
     ...notification,
     id: crypto.randomUUID(),
     timestamp: new Date().toISOString(),
     read: false,
    },
    ...state.notifications,
   ],
  })),

 markAsRead: (id) =>
  set((state) => ({
   notifications: state.notifications.map((n) =>
    n.id === id ? { ...n, read: true } : n
   ),
  })),

 clearNotifications: () => set({ notifications: [] }),
}));

