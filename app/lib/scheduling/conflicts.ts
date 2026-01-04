// lib/scheduling/conflicts.ts
import { createClient } from '@/utils/supabase/server';
import { ConflictCheckResponse } from '@/types/scheduling';

export async function findConflicts(
 tenantId: string,
 employeeId: string,
 startIso: string,
 endIso: string,
 excludeId?: string
): Promise<ConflictCheckResponse> {
 const supabase = createClient();
 const { data, error } = await supabase
  .rpc('find_schedule_conflicts', {
   p_tenant_id: tenantId,
   p_employee_id: employeeId,
   p_start: startIso,
   p_end: endIso,
   p_exclude_id: excludeId ?? null
  });

 if (error) {
  // If RPC not available or error, fallback is to rely on DB EXCLUDE later.
  return { hasConflict: false, conflicts: [] };
 }
 const conflicts = (data ?? []).map((s: any) => ({
  id: s.id,
  start_time: s.start_time,
  end_time: s.end_time,
  status: s.status
 }));
 return { hasConflict: conflicts.length > 0, conflicts };
}
