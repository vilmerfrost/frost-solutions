import { NextRequest } from 'next/server'
import { z } from 'zod'
import { resolveAuthAdmin, parseSearchParams, apiError, handleRouteError } from '@/lib/api'

const ExportQuerySchema = z.object({
  from: z.string().min(1, 'Start date is required'),
  to: z.string().min(1, 'End date is required'),
})

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await resolveAuthAdmin()
    if (auth.error) return auth.error

    const { id: projectId } = await params
    const parsed = parseSearchParams(req, ExportQuerySchema)
    if (parsed.error) return parsed.error

    const { from, to } = parsed.data

    const { data, error } = await auth.admin
      .from('site_attendance')
      .select('*')
      .eq('project_id', projectId)
      .eq('tenant_id', auth.tenantId)
      .gte('checked_in_at', `${from}T00:00:00Z`)
      .lte('checked_in_at', `${to}T23:59:59Z`)
      .order('checked_in_at', { ascending: true })

    if (error) return apiError('Failed to fetch attendance records', 500)

    const records = data ?? []

    // Build CSV
    const header = 'Namn,Personnummer (sista 4),Incheckning,Utcheckning,Metod,Anteckningar'
    const rows = records.map((r) => {
      const checkedIn = r.checked_in_at ? new Date(r.checked_in_at).toLocaleString('sv-SE') : ''
      const checkedOut = r.checked_out_at ? new Date(r.checked_out_at).toLocaleString('sv-SE') : ''
      const name = (r.person_name || '').replace(/,/g, ' ')
      const last4 = r.person_id_last4 || ''
      const method = r.check_in_method || 'manual'
      const notes = (r.notes || '').replace(/,/g, ' ').replace(/\n/g, ' ')
      return `${name},${last4},${checkedIn},${checkedOut},${method},${notes}`
    })

    const csv = [header, ...rows].join('\n')

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="personalliggare_${projectId}_${from}_${to}.csv"`,
      },
    })
  } catch (error) {
    return handleRouteError(error)
  }
}
