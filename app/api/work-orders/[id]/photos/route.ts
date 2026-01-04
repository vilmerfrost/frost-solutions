// app/api/work-orders/[id]/photos/route.ts

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId, verifyWorkOrderAccess } from '@/lib/work-orders/helpers';

const BUCKET = 'work-order-photos';
const MAX_BYTES = 50 * 1024 * 1024; // 50MB

function badRequest(message: string) {
 return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(
 req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  const { id } = await params;
  await verifyWorkOrderAccess(tenantId, id);

  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
   return badRequest('Filen saknas eller är ogiltig.');
  }

  if (file.size > MAX_BYTES) {
   return badRequest('Filen är för stor (max 50 MB).');
  }

  if (!file.type.startsWith('image/')) {
   return badRequest('Endast bildformat är tillåtna.');
  }

  const arrayBuf = await file.arrayBuffer();
  const input = Buffer.from(arrayBuf);

  // Process original: auto-rotate, limit to 2000x2000, jpeg quality 80
  const processed = await sharp(input, { failOnError: false })
   .rotate() // Auto-rotate based on EXIF
   .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
   .jpeg({ quality: 80, progressive: true })
   .toBuffer();

  // Thumbnail 300x300 cover
  const thumb = await sharp(input, { failOnError: false })
   .rotate()
   .resize({ width: 300, height: 300, fit: 'cover', position: 'center' })
   .jpeg({ quality: 70 })
   .toBuffer();

  const ext = 'jpg';
  const base = `${tenantId}/${id}/${randomUUID()}`;
  const originalPath = `${base}.${ext}`;
  const thumbPath = `${base}_thumb.${ext}`;

  const admin = createAdminClient();

  // Upload original
  const { error: uploadError } = await admin.storage
   .from(BUCKET)
   .upload(originalPath, processed, {
    contentType: 'image/jpeg',
    upsert: false
   });

  if (uploadError) {
   return NextResponse.json(
    { error: `Kunde inte ladda upp bild: ${extractErrorMessage(uploadError)}` },
    { status: 500 }
   );
  }

  // Upload thumbnail
  const { error: thumbError } = await admin.storage
   .from(BUCKET)
   .upload(thumbPath, thumb, {
    contentType: 'image/jpeg',
    upsert: false
   });

  if (thumbError) {
   console.error('Thumbnail upload failed:', thumbError);
   // Continue even if thumbnail fails
  }

  const { data: { user } } = await createClient().auth.getUser();

  const { data: photo, error: insErr } = await admin
   .from('work_order_photos')
   .insert({
    work_order_id: id,
    file_path: originalPath,
    thumbnail_path: thumbPath,
    file_size_bytes: processed.byteLength,
    mime_type: 'image/jpeg',
    uploaded_by: user?.id ?? null
   })
   .select('*')
   .single();

  if (insErr) {
   return NextResponse.json(
    { error: extractErrorMessage(insErr) },
    { status: 500 }
   );
  }

  // Signed URLs (7 days)
  const expiresIn = 60 * 60 * 24 * 7;
  const { data: signed } = await admin.storage
   .from(BUCKET)
   .createSignedUrl(originalPath, expiresIn);
  
  const { data: signedThumb } = await admin.storage
   .from(BUCKET)
   .createSignedUrl(thumbPath, expiresIn);

  return NextResponse.json({
   ...photo,
   url: signed?.signedUrl ?? null,
   thumbnail_url: signedThumb?.signedUrl ?? null
  }, { status: 201 });
 } catch (e) {
  console.error('Photo upload error:', e);
  return NextResponse.json(
   { error: (e as Error).message || 'Kunde inte ladda upp foto' },
   { status: 500 }
  );
 }
}

export async function GET(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string }> }
) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  const { id } = await params;
  await verifyWorkOrderAccess(tenantId, id);

  const admin = createAdminClient();
  const { data, error } = await admin
   .from('work_order_photos')
   .select('*')
   .eq('work_order_id', id)
   .order('uploaded_at', { ascending: false });

  if (error) {
   return NextResponse.json(
    { error: extractErrorMessage(error) },
    { status: 500 }
   );
  }

  const expiresIn = 60 * 60 * 24 * 7; // 7 days
  const enhanced = await Promise.all(
   (data ?? []).map(async (p) => {
    const { data: s1 } = await admin.storage
     .from(BUCKET)
     .createSignedUrl(p.file_path, expiresIn);
    
    const { data: s2 } = p.thumbnail_path
     ? await admin.storage
       .from(BUCKET)
       .createSignedUrl(p.thumbnail_path, expiresIn)
     : { data: null };

    return {
     ...p,
     url: s1?.signedUrl ?? null,
     thumbnail_url: s2?.signedUrl ?? null
    };
   })
  );

  return NextResponse.json(enhanced);
 } catch (e) {
  const status = (e as any)?.status ?? 500;
  return NextResponse.json(
   { error: (e as Error).message },
   { status }
  );
 }
}

