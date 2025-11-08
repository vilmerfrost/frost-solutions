// app/lib/offline/timeEntriesQueue.ts
// Simple offline queue for time entries using localStorage

const STORAGE_KEY = 'frost:offline_time_entries'

export interface OfflineTimeEntry {
  id: string // Temporary ID (generated client-side)
  tenant_id: string
  employee_id: string
  project_id?: string | null
  date: string
  start_time?: string | null
  end_time?: string | null
  hours_total: number
  ob_type?: string | null
  amount_total?: number
  is_billed: boolean
  break_minutes?: number
  comment?: string | null
  work_type?: string | null
  created_at: string // ISO timestamp
  synced: boolean
}

/**
 * Get all offline time entries from localStorage
 */
export function getOfflineTimeEntries(): OfflineTimeEntry[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as OfflineTimeEntry[]
  } catch (error) {
    console.error('Error reading offline time entries:', error)
    return []
  }
}

/**
 * Add a time entry to the offline queue
 */
export function addToOfflineQueue(entry: Omit<OfflineTimeEntry, 'id' | 'created_at' | 'synced'>): string {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add to offline queue on server')
  }

  const entries = getOfflineTimeEntries()
  const tempId = `tmp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const offlineEntry: OfflineTimeEntry = {
    ...entry,
    id: tempId,
    created_at: new Date().toISOString(),
    synced: false
  }

  entries.push(offlineEntry)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return tempId
  } catch (error) {
    console.error('Error saving offline time entry:', error)
    throw error
  }
}

/**
 * Remove a time entry from the offline queue (after successful sync)
 */
export function removeFromOfflineQueue(tempId: string): void {
  if (typeof window === 'undefined') return

  const entries = getOfflineTimeEntries()
  const filtered = entries.filter(e => e.id !== tempId)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error removing offline time entry:', error)
  }
}

/**
 * Mark a time entry as synced
 */
export function markAsSynced(tempId: string): void {
  if (typeof window === 'undefined') return

  const entries = getOfflineTimeEntries()
  const updated = entries.map(e => 
    e.id === tempId ? { ...e, synced: true } : e
  )
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error marking time entry as synced:', error)
  }
}

/**
 * Get pending (unsynced) time entries
 */
export function getPendingTimeEntries(): OfflineTimeEntry[] {
  return getOfflineTimeEntries().filter(e => !e.synced)
}

/**
 * Sync all pending time entries to the server
 */
export async function syncPendingTimeEntries(tenantId: string | null | undefined): Promise<{ synced: number; failed: number }> {
  if (!tenantId) {
    console.warn('⚠️ Cannot sync: tenantId is missing')
    return { synced: 0, failed: 0 }
  }

  const pending = getPendingTimeEntries()
  if (pending.length === 0) {
    console.log('✅ No pending entries to sync')
    return { synced: 0, failed: 0 }
  }

  console.log(`🔄 Syncing ${pending.length} pending time entries...`)
  let synced = 0
  let failed = 0

  for (const entry of pending) {
    try {
      // Convert offline entry to API format
      const payload = {
        tenant_id: entry.tenant_id || tenantId, // Use entry tenant_id or fallback to parameter
        employee_id: entry.employee_id,
        project_id: entry.project_id,
        date: entry.date,
        start_time: entry.start_time,
        end_time: entry.end_time,
        hours_total: entry.hours_total,
        ob_type: entry.ob_type,
        amount_total: entry.amount_total,
        is_billed: entry.is_billed,
        break_minutes: entry.break_minutes,
        comment: entry.comment,
        work_type: entry.work_type,
      }

      console.log('📤 Syncing entry:', { id: entry.id, date: entry.date, hours: entry.hours_total })

      const response = await fetch('/api/time-entries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const responseData = await response.json()

      if (response.ok && !responseData.error) {
        console.log('✅ Successfully synced entry:', entry.id)
        markAsSynced(entry.id)
        // Remove after a delay to allow for UI updates
        setTimeout(() => removeFromOfflineQueue(entry.id), 1000)
        synced++
      } else {
        console.error('❌ Failed to sync time entry:', responseData.error || responseData.message || 'Unknown error')
        failed++
      }
    } catch (error) {
      console.error('❌ Error syncing time entry:', error)
      failed++
    }
  }

  console.log(`✅ Sync complete: ${synced} synced, ${failed} failed`)
  return { synced, failed }
}

/**
 * Clear all synced entries (cleanup)
 */
export function clearSyncedEntries(): void {
  if (typeof window === 'undefined') return

  const entries = getOfflineTimeEntries()
  const unsynced = entries.filter(e => !e.synced)
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unsynced))
  } catch (error) {
    console.error('Error clearing synced entries:', error)
  }
}

