// app/api/work-orders/[id]/photos/[photoId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { extractErrorMessage } from '@/lib/errorUtils';
import { getTenantId, verifyWorkOrderAccess, getUserRole } from '@/lib/work-orders/helpers';

const BUCKET = 'work-order-photos';

export async function DELETE(
 _req: NextRequest,
 { params }: { params: Promise<{ id: string; photoId: string }> }
) {
 try {
  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Ingen tenant hittades.' }, { status: 403 });
  }

  const { id, photoId } = await params;
  await verifyWorkOrderAccess(tenantId, id);

  const admin = createAdminClient();
  const { data: photo, error: getErr } = await admin
   .from('work_order_photos')
   .select('*')
   .eq('id', photoId)
   .single();

  if (getErr || !photo) {
   return NextResponse.json(
    { error: 'Foto hittades inte.' },
    { status: 404 }
   );
  }

  // Permission: admin or uploaded_by
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
   return NextResponse.json({ error: 'Du är inte inloggad.' }, { status: 401 });
  }

  if (user.id !== photo.uploaded_by) {
   // Check if admin
   const role = await getUserRole();
   if (role !== 'admin') {
    return NextResponse.json(
     { error: 'Du har inte behörighet att ta bort detta foto.' },
     { status: 403 }
    );
   }
  }

  // Remove from storage (both files)
  const paths = [photo.file_path, photo.thumbnail_path].filter(Boolean) as string[];
  
  if (paths.length > 0) {
   const { error: stErr } = await admin.storage
    .from(BUCKET)
    .remove(paths);

   if (stErr) {
    return NextResponse.json(
     { error: extractErrorMessage(stErr) },
     { status: 500 }
    );
   }
  }

  // Remove metadata
  const { error: delErr } = await admin
   .from('work_order_photos')
   .delete()
   .eq('id', photoId);

  if (delErr) {
   return NextResponse.json(
    { error: extractErrorMessage(delErr) },
    { status: 500 }
   );
  }

  return new NextResponse(null, { status: 204 });
 } catch (e) {
  const status = (e as any)?.status ?? 500;
  return NextResponse.json(
   { error: (e as Error).message },
   { status }
  );
 }
}

