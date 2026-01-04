// app/lib/duplicateCheck.ts

/**
 * Duplicate time entry detection utilities
 * Checks for overlapping time entries to prevent duplicates
 */

interface TimeEntryCheck {
 employee_id: string;
 project_id: string;
 date: string;
 start_time: string | null;
 end_time: string | null;
 tenant_id?: string;
}

interface ExistingTimeEntry {
 id: string;
 employee_id: string;
 project_id: string;
 date: string;
 start_time: string | null;
 end_time: string | null;
}

/**
 * Checks if a new time entry overlaps with existing entries
 * @param newEntry - The new time entry to check
 * @param existingEntries - Array of existing time entries for the same employee/date
 * @returns true if there's an overlap (duplicate), false otherwise
 */
export function checkTimeOverlap(
 newEntry: TimeEntryCheck,
 existingEntries: ExistingTimeEntry[]
): boolean {
 if (!existingEntries || existingEntries.length === 0) {
  return false;
 }

 // Parse new entry times
 const newStart = newEntry.start_time ? new Date(newEntry.start_time) : null;
 const newEnd = newEntry.end_time ? new Date(newEntry.end_time) : null;

 // If new entry has no start time, it can't overlap
 if (!newStart) {
  return false;
 }

 // Check each existing entry for overlap
 for (const existing of existingEntries) {
  // Skip if different project (can have overlapping times for different projects)
  if (existing.project_id !== newEntry.project_id) {
   continue;
  }

  // Skip if existing entry has no start time
  if (!existing.start_time) {
   continue;
  }

  const existingStart = new Date(existing.start_time);
  const existingEnd = existing.end_time ? new Date(existing.end_time) : null;

  // Check for overlap
  // Overlap occurs if:
  // 1. New entry starts before existing ends and new entry ends after existing starts
  // 2. Or if new entry has no end_time and it starts before existing ends
  // 3. Or if existing has no end_time and new entry starts after existing starts

  if (newEnd && existingEnd) {
   // Both have end times - check for overlap
   if (newStart < existingEnd && newEnd > existingStart) {
    return true;
   }
  } else if (newEnd && !existingEnd) {
   // New has end, existing doesn't (active entry)
   if (newStart < existingStart && newEnd > existingStart) {
    return true;
   }
  } else if (!newEnd && existingEnd) {
   // New doesn't have end (active entry), existing has end
   if (newStart >= existingStart && newStart < existingEnd) {
    return true;
   }
  } else {
   // Both are active entries (no end_time)
   // Overlap if same date
   if (existing.date === newEntry.date) {
    return true;
   }
  }
 }

 return false;
}

/**
 * Formats a user-friendly message about a duplicate time entry
 * @param existingEntry - The existing entry that conflicts
 * @returns Formatted message string
 */
export function formatDuplicateMessage(existingEntry: ExistingTimeEntry): string {
 const date = new Date(existingEntry.date).toLocaleDateString('sv-SE');
 const startTime = existingEntry.start_time
  ? new Date(existingEntry.start_time).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
   })
  : 'Stämplat in';
 const endTime = existingEntry.end_time
  ? new Date(existingEntry.end_time).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit',
   })
  : 'Pågående';

 return `Det finns redan en tidsrapport för detta datum (${date}) som överlappar med denna tid:\n\nTid: ${startTime} - ${endTime}`;
}

