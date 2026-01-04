import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * GET /api/ata/[id]/timeline
 * Hämtar status_timeline för ÄTA
 */
export async function GET(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tenantId = await getTenantId()
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  const { id } = await params

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hämta ÄTA med timeline
  const { data: ata, error: ataError } = await adminSupabase
   .from('rot_applications')
   .select('id, status_timeline')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (ataError || !ata) {
   return NextResponse.json(
    { error: 'ÄTA not found' },
    { status: 404 }
   )
  }

  return NextResponse.json({
   id: ata.id,
   status_timeline: ata.status_timeline || [],
  })
 } catch (error: any) {
  console.error('Error in GET /api/ata/[id]/timeline:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

