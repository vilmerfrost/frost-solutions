import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * API route för att ladda upp filer till Supabase Storage
 */
export async function POST(req: Request) {
 try {
  const supabase = createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (userError || !user) {
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File
  const entityType = formData.get('entityType') as string // 'project' or 'invoice'
  const entityId = formData.get('entityId') as string
  const description = formData.get('description') as string || ''

  if (!file) {
   return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!entityType || !entityId) {
   return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 })
  }

  // Validate file type and size
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
   return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain']
  if (!allowedTypes.includes(file.type)) {
   return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
   return NextResponse.json(
    { error: 'Storage not configured' },
    { status: 500 }
   )
  }

  const adminSupabase = createAdminClient(supabaseUrl, serviceKey)

  // Generate file path
  const timestamp = Date.now()
  const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
  const filePath = `${entityType}/${entityId}/${timestamp}_${sanitizedFileName}`

  // Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await adminSupabase.storage
   .from('attachments')
   .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
   })

  if (uploadError) {
   console.error('Error uploading file:', uploadError)
   return NextResponse.json(
    { error: uploadError.message || 'Failed to upload file' },
    { status: 500 }
   )
  }

  // Get public URL
  const { data: urlData } = adminSupabase.storage
   .from('attachments')
   .getPublicUrl(filePath)

  // Save file metadata to database (optional - you might want to create a files table)
  // For now, we'll just return the URL

  return NextResponse.json({
   success: true,
   filePath,
   url: urlData.publicUrl,
   fileName: file.name,
   fileSize: file.size,
   fileType: file.type,
  })
 } catch (err: any) {
  console.error('Error in file upload:', err)
  return NextResponse.json(
   { error: err.message || 'Internal server error' },
   { status: 500 }
  )
 }
}

