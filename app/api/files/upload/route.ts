import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { checkRateLimit, getClientIP, isValidUUID } from '@/lib/security'

// Magic bytes for file type validation (first few bytes of file content)
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
}

/**
 * Validate file content by checking magic bytes
 * Returns true if file content matches expected type
 */
async function validateFileMagicBytes(file: File): Promise<boolean> {
  const magicSignatures = MAGIC_BYTES[file.type]
  
  // For text/plain, we can't validate magic bytes - just check it's valid UTF-8
  if (file.type === 'text/plain') {
    try {
      const text = await file.text()
      // Check for null bytes which indicate binary content
      return !text.includes('\x00')
    } catch {
      return false
    }
  }
  
  // If no magic bytes defined for this type, allow it
  if (!magicSignatures) {
    return true
  }
  
  // Read the first few bytes of the file
  const buffer = await file.slice(0, 8).arrayBuffer()
  const bytes = new Uint8Array(buffer)
  
  // Check if any magic signature matches
  return magicSignatures.some(signature => 
    signature.every((byte, index) => bytes[index] === byte)
  )
}

/**
 * API route för att ladda upp filer till Supabase Storage
 */
export async function POST(req: Request) {
 try {
  // Rate limit: 10 uploads per hour per IP
  const clientIP = getClientIP(req)
  const rateLimitResult = checkRateLimit(`file-upload:${clientIP}`, 10, 60 * 60 * 1000)
  if (!rateLimitResult.allowed) {
   return NextResponse.json(
    { error: 'För många uppladdningar. Försök igen senare.' },
    { 
     status: 429,
     headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
    }
   )
  }

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

  // SECURITY: Validate entityType to prevent path traversal
  const allowedEntityTypes = ['project', 'invoice', 'employee', 'quote', 'supplier-invoice']
  if (!allowedEntityTypes.includes(entityType)) {
   return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
  }

  // SECURITY: Validate entityId is a valid UUID to prevent path traversal
  if (!isValidUUID(entityId)) {
   return NextResponse.json({ error: 'Invalid entity ID format' }, { status: 400 })
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

  // SECURITY: Validate file content matches claimed MIME type (magic bytes check)
  const isValidContent = await validateFileMagicBytes(file)
  if (!isValidContent) {
   return NextResponse.json({ 
    error: 'File content does not match declared type. Possible malicious file.' 
   }, { status: 400 })
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

