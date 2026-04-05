import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { resolveTimeEntryContext, TimeEntryContextError } from '../_utils'
import { handleRouteError } from '@/lib/api'

/**
 * API route for listing time_entries with service role
 * Bypasses RLS and ensures correct tenant_id
 */
export async function GET(req: NextRequest) {
  try {
    const { tenantId, adminSupabase, isAdmin, employeeId } = await resolveTimeEntryContext()

    // Always explicitly include approval columns
    const selectString = '*, approval_status, approved_at, approved_by'

    // Handle date filter if provided
    const dateFilter = req.nextUrl.searchParams.get('date')

    // Build query
    let query = adminSupabase
      .from('time_entries')
      .select(selectString)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(100)

    if (dateFilter) {
      query = query.eq('date', dateFilter)
    }

    // If not admin, only show own entries
    if (!isAdmin && employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data: entries, error } = await query

    if (error) {
      console.error('[List API] Error fetching time entries:', error)

      // If column error, retry with explicit fallback list
      if (error.message?.includes('column') || error.code === '42703') {
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
            { error: fallbackError.message || 'Failed to fetch time entries' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
          )
        }

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
        { error: error.message || 'Failed to fetch time entries' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      )
    }

    // Add cache headers to prevent stale data
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
  } catch (err) {
    if (err instanceof TimeEntryContextError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return handleRouteError(err)
  }
}
