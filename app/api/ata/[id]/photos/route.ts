import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getTenantId } from '@/lib/serverTenant'

/**
 * POST /api/ata/[id]/photos
 * Lägger till bilder till ÄTA
 */
export async function POST(
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

  // Kontrollera admin-access
  const { data: employeeData } = await adminSupabase
   .from('employees')
   .select('id, role')
   .eq('auth_user_id', user.id)
   .eq('tenant_id', tenantId)
   .single()

  if (!employeeData || employeeData.role !== 'admin') {
   return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
   )
  }

  // Hämta ÄTA
  const { data: ata, error: ataError } = await adminSupabase
   .from('rot_applications')
   .select('id, photos')
   .eq('id', id)
   .eq('tenant_id', tenantId)
   .single()

  if (ataError || !ata) {
   return NextResponse.json(
    { error: 'ÄTA not found' },
    { status: 404 }
   )
  }

  const formData = await req.formData()
  const files = formData.getAll('photos') as File[]

  if (!files || files.length === 0) {
   return NextResponse.json(
    { error: 'No files provided' },
    { status: 400 }
   )
  }

  // Validera filer
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

  for (const file of files) {
   if (file.size > maxSize) {
    return NextResponse.json(
     { error: `File ${file.name} exceeds 10MB limit` },
     { status: 400 }
    )
   }
   if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
     { error: `File ${file.name} is not a valid image type` },
     { status: 400 }
    )
   }
  }

  // Upload till Supabase Storage
  const uploadedUrls: string[] = []
  const existingPhotos = (ata.photos || []) as string[]

  for (const file of files) {
   const fileName = `${tenantId}/${id}/${Date.now()}-${file.name}`
   const arrayBuffer = await file.arrayBuffer()
   const buffer = Buffer.from(arrayBuffer)

   const { data: uploadData, error: uploadError } = await adminSupabase.storage
    .from('ata-photos')
    .upload(fileName, buffer, {
     contentType: file.type,
     upsert: false,
    })

   if (uploadError) {
    console.error('Error uploading file:', uploadError)
    continue // Fortsätt med nästa fil
   }

   // Hämta public URL
   const { data: urlData } = adminSupabase.storage
    .from('ata-photos')
    .getPublicUrl(fileName)

   if (urlData?.publicUrl) {
    uploadedUrls.push(urlData.publicUrl)
   }
  }

  if (uploadedUrls.length === 0) {
   return NextResponse.json(
    { error: 'Failed to upload any files' },
    { status: 500 }
   )
  }

  // Uppdatera ÄTA med nya bilder
  const updatedPhotos = [...existingPhotos, ...uploadedUrls]

  const { data: updatedAta, error: updateError } = await adminSupabase
   .from('rot_applications')
   .update({ photos: updatedPhotos })
   .eq('id', id)
   .select('id, photos')
   .single()

  if (updateError) {
   console.error('Error updating ÄTA:', updateError)
   return NextResponse.json(
    { error: 'Failed to update photos', details: updateError.message },
    { status: 500 }
   )
  }

  // Logga audit event
  try {
   await adminSupabase.rpc('append_audit_event', {
    p_tenant_id: tenantId,
    p_table_name: 'rot_applications',
    p_record_id: id,
    p_action: 'update',
    p_user_id: user.id,
    p_employee_id: employeeData.id,
    p_old_values: { photos: existingPhotos },
    p_new_values: { photos: updatedPhotos },
    p_changed_fields: ['photos'],
   })
  } catch (auditError) {
   console.error('Error logging audit event:', auditError)
  }

  return NextResponse.json({
   id: updatedAta?.id,
   photos: updatedAta?.photos || [],
  })
 } catch (error: any) {
  console.error('Error in POST /api/ata/[id]/photos:', error)
  return NextResponse.json(
   { error: 'Internal server error', details: error.message },
   { status: 500 }
  )
 }
}

