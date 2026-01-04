// lib/scheduling/autoTimeEntry.ts
import { createClient } from '@/utils/supabase/server';
import type { TimeEntry } from '@/types/scheduling';
import { extractErrorMessage } from '@/lib/errorUtils';

/**
 * Server-side helper to force-create/refresh the time entry for a given schedule.
 * This mirrors the DB trigger but is useful for manual repair or explicit flows.
 */
export async function createTimeEntryFromSchedule(scheduleId: string): Promise<TimeEntry> {
 const supabase = createClient(); // uses user session; RLS allows call via GRANT EXECUTE
 const { data, error } = await supabase.rpc('create_time_entry_from_schedule', {
  p_schedule_id: scheduleId
 });

 if (error) {
  throw new Error(`Failed to create time entry: ${extractErrorMessage(error)}`);
 }

 return data as TimeEntry;
}
