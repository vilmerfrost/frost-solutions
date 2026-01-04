// app/lib/integrations/sync/SyncStateMachine.ts

import type { SyncJob, SyncState } from '@/types/integrations';
import { SyncQueue } from './SyncQueue';

export class SyncStateMachine {
 private validTransitions: Record<SyncState, SyncState[]> = {
  pending: ['processing', 'failed'],
  processing: ['completed', 'failed', 'requires_manual_resolution', 'pending'],
  completed: ['pending'], // For re-sync
  failed: ['pending', 'processing'], // For retry
  requires_manual_resolution: ['pending'], // When user resolves conflict
 };

 canTransition(from: SyncState, to: SyncState): boolean {
  return this.validTransitions[from]?.includes(to) || false;
 }

 async transition(
  job: SyncJob,
  newState: SyncState,
  queue: SyncQueue,
  error?: string
 ) {
  if (this.canTransition(job.status as SyncState, newState)) {
   await queue.releaseJob(job, newState, error);
  } else {
   throw new Error(`Invalid state transition: ${job.status} -> ${newState}`);
  }
 }
}

