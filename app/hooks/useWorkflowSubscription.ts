// app/hooks/useWorkflowSubscription.ts

/**
 * Workflow Real-time Subscription Hook
 * Based on Gemini implementation
 */

'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import supabase from '@/utils/supabase/supabaseClient';
import { useWorkflowStore } from '@/lib/store/workflowStore';
import type { WorkflowExecution } from '@/types/workflow';

/**
 * Denna hook hanterar Supabase Realtime-prenumerationen.
 * Den uppdaterar React Query-cachen och skickar notiser.
 * Kör den en gång i din rot-layout för den inloggade användaren.
 */
export function useWorkflowSubscription(userId: string) {
  const queryClient = useQueryClient();
  const { setConnection, addNotification } = useWorkflowStore();

  useEffect(() => {
    if (!userId) return;

    // Skapa en kanal unik för denna användare
    const channel = supabase
      .channel(`workflow-updates-for-user-${userId}`)
      .on<WorkflowExecution>(
        'postgres_changes',
        {
          event: '*', // Lyssna på INSERT och UPDATE
          schema: 'public',
          table: 'workflow_executions',
          filter: `user_id=eq.${userId}`, // RLS för prenumerationer
        },
        (payload) => {
          const newRecord = payload.new as WorkflowExecution;

          // 1. Uppdatera React Query-cachen för den specifika posten
          queryClient.setQueryData(['workflow', newRecord.id], newRecord);

          // 2. Invalidera list-queries
          queryClient.invalidateQueries({ queryKey: ['workflows'] });

          // 3. Skicka notiser baserat på statusförändringar
          if (payload.eventType === 'UPDATE') {
            const oldRecord = payload.old as Partial<WorkflowExecution>;

            if (newRecord.status === 'success' && oldRecord.status !== 'success') {
              addNotification({
                type: 'success',
                message: `Arbetsflöde för ${newRecord.file_path.split('/').pop()} lyckades.`,
                workflow_id: newRecord.id,
              });
            }

            if (newRecord.status === 'failed' && oldRecord.status !== 'failed') {
              addNotification({
                type: 'error',
                message: `Arbetsflöde misslyckades: ${newRecord.error_message || 'Okänt fel'}`,
                workflow_id: newRecord.id,
              });
            }

            if (
              newRecord.status === 'partial_success' &&
              oldRecord.status !== 'partial_success'
            ) {
              addNotification({
                type: 'warning',
                message: `Arbetsflöde slutfört med varningar.`,
                workflow_id: newRecord.id,
              });
            }
          }
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          setConnection('connected');
        } else if (status === 'CHANNEL_ERROR' || err) {
          setConnection('disconnected');
          console.error('Supabase subscription error:', err);
        } else if (status === 'TIMED_OUT') {
          setConnection('reconnecting');
        }
      });

    return () => {
      // Städa upp prenumerationen när komponenten unmountas
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, setConnection, addNotification]);
}

