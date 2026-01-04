import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getTenantId } from '@/lib/serverTenant'

/**
 * Export ROT-data för GDPR-compliance
 * Exporterar alla ROT-ansökningar för en tenant som JSON
 */
export async function GET(
 req: Request,
 { params }: { params: Promise<{ tenantId: string }> }
) {
 try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { tenantId } = await params
  const userTenantId = await getTenantId()

  // Verifiera att användaren tillhör rätt tenant
  if (!userTenantId || userTenantId !== tenantId) {
   return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Hämta alla ROT-ansökningar för tenant
  const { data: applications, error: appError } = await supabase
   .from('rot_applications')
   .select(`
    *,
    projects(name),
    clients(name)
   `)
   .eq('tenant_id', tenantId)

  if (appError) {
   return NextResponse.json({ error: appError.message }, { status: 500 })
  }

  // Hämta status history
  const applicationIds = applications?.map(a => a.id) || []
  const { data: statusHistory } = applicationIds.length > 0
   ? await supabase
     .from('rot_status_history')
     .select('*')
     .in('rot_application_id', applicationIds)
   : { data: [] }

  // Formatera data för export
  const exportData = {
   export_date: new Date().toISOString(),
   tenant_id: tenantId,
   applications: (applications || []).map(app => ({
    id: app.id,
    case_number: app.case_number,
    customer_person_number: app.customer_person_number, // OBS: Personnummer i export
    property_designation: app.property_designation,
    work_type: app.work_type,
    work_cost_sek: app.work_cost_sek,
    material_cost_sek: app.material_cost_sek,
    total_cost_sek: app.total_cost_sek,
    status: app.status,
    submission_date: app.submission_date,
    project: app.projects?.name,
    client: app.clients?.name,
    status_history: (statusHistory || []).filter((s: any) => s.rot_application_id === app.id),
   })),
  }

  // Returnera som JSON
  return NextResponse.json(exportData, {
   headers: {
    'Content-Type': 'application/json',
    'Content-Disposition': `attachment; filename="rot-export-${tenantId}-${new Date().toISOString().split('T')[0]}.json"`,
   },
  })
 } catch (err: any) {
  console.error('Error exporting ROT data:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

