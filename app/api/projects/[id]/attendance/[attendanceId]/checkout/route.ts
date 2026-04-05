import { NextRequest } from 'next/server'
import { resolveAuthAdmin, apiSuccess, apiError, handleRouteError } from '@/lib/api'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; attendanceId: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId, attendanceId } = await params

    // Verify the attendance record exists and belongs to this project/tenant
    const { data: record, error: fetchError } = await auth.admin
      .from('site_attendance')
      .select('id, checked_out_at')
      .eq('id', attendanceId)
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .single()

    if (fetchError || !record) return apiError('Attendance record not found', 404)

    if (record.checked_out_at) {
      return apiError('Already checked out', 400)
    }

    const { data, error } = await auth.admin
      .from('site_attendance')
      .update({ checked_out_at: new Date().toISOString() })
      .eq('id', attendanceId)
      .eq('tenant_id', auth.tenantId)
      .select()
      .single()

    if (error || !data) return apiError('Failed to check out', 500)

    return apiSuccess(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
