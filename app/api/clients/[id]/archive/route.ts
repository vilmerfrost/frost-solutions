import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getBaseUrlFromHeaders } from '@/utils/url'

/**
 * API route för att arkivera/återställa en kund
 * Använder service role för säkerhet
 */
export async function PATCH(
 req: Request,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const { id: clientId } = await params
  const { action } = await req.json() // 'archive' eller 'restore'

  if (!['archive', 'restore'].includes(action)) {
   return NextResponse.json(
    { error: 'Invalid action. Use "archive" or "restore"' },
    { status: 400 }
   )
  }

  // Check admin
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Use getBaseUrlFromHeaders to get current origin (works with ngrok, localhost, production)
  const baseUrl = getBaseUrlFromHeaders(req.headers)
  const adminCheckRes = await fetch(`${baseUrl}/api/admin/check`, {
   headers: {
    'Cookie': req.headers.get('Cookie') || '',
   },
  })
  let isAdmin = false
  if (adminCheckRes?.ok) {
   const adminData = await adminCheckRes.json()
   isAdmin = adminData.isAdmin || false
  }

  if (!isAdmin) {
   return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  // Get tenant
  const tenantId = (user.app_metadata as any)?.tenant_id || null
  if (!tenantId) {
   return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
  }

  // Use service role
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Service role key not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Check if clients table has archived or status column
  // Try to archive - use archived boolean first, then status column
  let updateResult
  
  // Try with archived column first
  updateResult = await adminSupabase
   .from('clients')
   .update({ archived: action === 'archive' })
   .eq('id', clientId)
   .eq('tenant_id', tenantId)
   .select()
   .single()

  // If archived column doesn't exist, try status column
  if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('archived'))) {
   updateResult = await adminSupabase
    .from('clients')
    .update({ status: action === 'archive' ? 'archived' : 'active' })
    .eq('id', clientId)
    .eq('tenant_id', tenantId)
    .select()
    .single()
  }

  // If status column doesn't exist either, create a note column or use a workaround
  if (updateResult.error && (updateResult.error.code === '42703' || updateResult.error.message?.includes('status'))) {
   // Last resort: update with a flag in notes or just verify it exists
   // For now, we'll return an error suggesting schema update
   return NextResponse.json(
    { 
     error: 'Archive functionality requires "archived" boolean or "status" column in clients table',
     suggestion: 'Add column: ALTER TABLE clients ADD COLUMN archived BOOLEAN DEFAULT false;'
    },
    { status: 500 }
   )
  }

  if (updateResult.error) {
   console.error('Error updating client:', updateResult.error)
   return NextResponse.json(
    { error: updateResult.error.message || 'Failed to update client' },
    { status: 500 }
   )
  }

  return NextResponse.json({
   success: true,
   client: updateResult.data,
   message: action === 'archive' ? 'Client archived successfully' : 'Client restored successfully',
  })
 } catch (err: any) {
  console.error('Error in clients/[id]/archive API:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

