import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

/**
 * POST /api/public/[token]/sign
 * Signerar resurs via publik länk
 */
export async function POST(
 req: Request,
 { params }: { params: Promise<{ token: string }> }
) {
 try {
  const { token } = await params
  const body = await req.json()
  const { signer_name, signer_email, signature_method = 'email', password } = body

  if (!signer_name || !signer_email) {
   return NextResponse.json(
    { error: 'signer_name and signer_email are required' },
    { status: 400 }
   )
  }

  const adminSupabase = createAdminClient(
   process.env.NEXT_PUBLIC_SUPABASE_URL!,
   process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Hämta public link
  const { data: publicLink, error: linkError } = await adminSupabase
   .from('public_links')
   .select('*')
   .eq('access_token', token)
   .eq('active', true)
   .single()

  if (linkError || !publicLink) {
   return NextResponse.json(
    { error: 'Link not found or inactive' },
    { status: 404 }
   )
  }

  // Kontrollera expiration
  if (publicLink.expires_at && new Date(publicLink.expires_at) < new Date()) {
   return NextResponse.json(
    { error: 'Link has expired' },
    { status: 400 }
   )
  }

  // Kontrollera lösenord om det finns
  if (publicLink.password_hash) {
   if (!password) {
    return NextResponse.json(
     { error: 'Password required' },
     { status: 401 }
    )
   }

   const isValid = await bcrypt.compare(password, publicLink.password_hash)
   if (!isValid) {
    return NextResponse.json(
     { error: 'Invalid password' },
     { status: 401 }
    )
   }
  }

  // Hämta resurs för att generera hash
  const tableMap: Record<string, string> = {
   quote: 'quotes',
   invoice: 'invoices',
   ata: 'rot_applications',
   project: 'projects',
   rot_application: 'rot_applications',
  }

  const tableName = tableMap[publicLink.resource_type]
  const { data: resource } = await adminSupabase
   .from(tableName)
   .select('*')
   .eq('id', publicLink.resource_id)
   .single()

  if (!resource) {
   return NextResponse.json(
    { error: 'Resource not found' },
    { status: 404 }
   )
  }

  // Generera hash av dokumentet
  const documentString = JSON.stringify(resource)
  const signatureHash = crypto.createHash('sha256').update(documentString).digest('hex')

  // Skapa signature-record
  const { data: signature, error: signatureError } = await adminSupabase
   .from('signatures')
   .insert({
    tenant_id: publicLink.tenant_id,
    document_type: publicLink.resource_type,
    document_id: publicLink.resource_id,
    signer_role: 'customer',
    signer_email,
    signature_method,
    signature_hash: signatureHash,
    signed_at: new Date().toISOString(),
    status: 'signed',
   })
   .select()
   .single()

  if (signatureError) {
   console.error('Error creating signature:', signatureError)
   return NextResponse.json(
    { error: 'Failed to create signature', details: signatureError.message },
    { status: 500 }
   )
  }

  // Uppdatera resurs med signature_id om det är ÄTA
  if (publicLink.resource_type === 'ata' || publicLink.resource_type === 'rot_application') {
   await adminSupabase
    .from('rot_applications')
    .update({ signature_id: signature.id })
    .eq('id', publicLink.resource_id)
  }

  // Logga event
  const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
  const userAgent = req.headers.get('user-agent') || null

  await adminSupabase
   .from('public_link_events')
   .insert({
    public_link_id: publicLink.id,
    event_type: 'signed',
    ip_address: ipAddress,
    user_agent: userAgent,
    event_data: { signer_name, signer_email },
   })

  await adminSupabase
   .from('signature_events')
   .insert({
    signature_id: signature.id,
    event_type: 'signed',
    event_data: { signer_name, signer_email, ip_address: ipAddress },
   })

  return NextResponse.json({
   signature_id: signature.id,
   status: signature.status,
   signed_at: signature.signed_at,
  })
 } catch (error: any) {
  console.error('Error in POST /api/public/[token]/sign:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

