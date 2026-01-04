import { NextResponse } from 'next/server'
import { resolveTimeEntryContext, getTimeEntryColumnSet, TimeEntryContextError } from '../_utils'

/**
 * API route för att hämta time_entries med service role
 * Bypassar RLS och säkerställer korrekt tenant_id
 */
export async function GET(req: Request) {
 try {
  const { tenantId, adminSupabase, isAdmin, employeeId } = await resolveTimeEntryContext()

  // CRITICAL FIX: Always explicitly include approval columns
  // Don't rely on columnSet detection - always try to include them
  // Use '*' to get all columns, then explicitly add approval columns
  const selectString = `
   *,
   approval_status,
   approved_at,
   approved_by
  `.trim().replace(/\s+/g, ' ');
  
  console.log('[List API] Using explicit SELECT with approval columns');

  // Handle date filter if provided
  const { searchParams } = new URL(req.url);
  const dateFilter = searchParams.get('date'); // YYYY-MM-DD format
  
  // Build query - CRITICAL: Använd selectString som inkluderar approval-kolumnerna
  let query = adminSupabase
   .from('time_entries')
   .select(selectString)
   .eq('tenant_id', tenantId)
   .order('date', { ascending: false })
   .order('start_time', { ascending: false })
   .limit(100)

  // Apply date filter if provided
  if (dateFilter) {
   query = query.eq('date', dateFilter)
  }

  // If not admin, only show own entries
  if (!isAdmin && employeeId) {
   query = query.eq('employee_id', employeeId)
  }

  const { data: entries, error } = await query

  if (error) {
   console.error('[List API] ❌ Error fetching time entries:', error)
   
   // Om felet är relaterat till kolumner som inte finns, försök med explicit lista
   if (error.message?.includes('column') || error.code === '42703') {
    console.log('[List API] ⚠️ Column error detected, retrying with explicit column list')
    
    // Explicit lista utan approval-kolumner först
    const fallbackColumns = [
     'id', 'date', 'hours_total', 'ob_type', 'project_id', 
     'employee_id', 'start_time', 'end_time', 'tenant_id'
    ]
    
    let fallbackQuery = adminSupabase
     .from('time_entries')
     .select(fallbackColumns.join(', '))
     .eq('tenant_id', tenantId)
     .order('date', { ascending: false })
     .order('start_time', { ascending: false })
     .limit(100)
    
    if (dateFilter) {
     fallbackQuery = fallbackQuery.eq('date', dateFilter)
    }
    if (!isAdmin && employeeId) {
     fallbackQuery = fallbackQuery.eq('employee_id', employeeId)
    }
    
    const { data: fallbackEntries, error: fallbackError } = await fallbackQuery
    
    if (fallbackError) {
     return NextResponse.json(
      { error: fallbackError.message || 'Failed to fetch time entries', details: fallbackError },
      { 
       status: 500,
       headers: { 'Cache-Control': 'no-store' }
      }
     )
    }
    
    console.log('[List API] ✅ Found entries (fallback, no approval columns)', {
     count: fallbackEntries?.length || 0,
     tenantId,
    })
    
    return NextResponse.json({
     timeEntries: fallbackEntries || [],
     entries: fallbackEntries || [],
     isAdmin,
     employeeId,
     tenantId,
     count: fallbackEntries?.length || 0
    }, {
     headers: { 'Cache-Control': 'no-store' }
    })
   }
   
   return NextResponse.json(
    { error: error.message || 'Failed to fetch time entries', details: error },
    { 
     status: 500,
     headers: { 'Cache-Control': 'no-store' }
    }
   )
  }

  // Logga approval-status för första raderna för debugging
  const sampleWithApproval = entries?.slice(0, 5).map(e => ({
   id: e.id,
   hours: e.hours_total,
   date: e.date,
   approval_status: e.approval_status,
   approved_at: e.approved_at,
   status: e.status,
  }))

  console.log('✅ API: Found entries', {
   count: entries?.length || 0,
   tenantId,
   sample: sampleWithApproval,
   approvalStatusCount: entries?.filter((e: any) => e.approval_status === 'approved').length || 0,
  })

  // If no entries found, try to find any entries for this employee regardless of tenant
  if ((!entries || entries.length === 0) && employeeId) {
   console.log('⚠️ No entries found for tenant, trying to find any entries for employee')
   const { data: anyEntries } = await adminSupabase
    .from('time_entries')
    .select('id, date, hours_total, ob_type, project_id, employee_id, start_time, end_time, tenant_id')
    .eq('employee_id', employeeId)
    .limit(5)
   
   if (anyEntries && anyEntries.length > 0) {
    console.log('🔍 Found entries with different tenant:', anyEntries.map(e => e.tenant_id))
   }
  }

  // CRITICAL: Add cache headers to prevent stale data
  return NextResponse.json({
   timeEntries: entries || [],
   entries: entries || [],
   isAdmin,
   employeeId,
   tenantId,
   count: entries?.length || 0
  }, {
   headers: {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
   }
  })
 } catch (err: any) {
  if (err instanceof TimeEntryContextError) {
   return NextResponse.json({ error: err.message }, { status: err.status })
  }
  console.error('❌ Unexpected error in time-entries/list:', err)
  return NextResponse.json(
   { error: 'Internal server error', details: err.message },
   { status: 500 }
  )
 }
}


