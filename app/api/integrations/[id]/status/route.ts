// app/api/integrations/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';
import { extractErrorMessage } from '@/lib/errorUtils';

// Force Node.js runtime (not Edge) for better Supabase compatibility
export const runtime = 'nodejs';
// Force dynamic rendering - status should never be statically cached
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
 try {
  const { id: integrationId } = await params;
  
  // Validate integrationId
  if (!integrationId || integrationId === 'undefined') {
   console.error('❌ Missing or invalid integration ID:', integrationId);
   return NextResponse.json({ error: 'Integration ID saknas eller är ogiltigt' }, { status: 400 });
  }

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json({ error: 'Tenant ID saknas' }, { status: 401 });
  }

  // Create admin client with 8s timeout (handled by fetch wrapper)
  const admin = createAdminClient(8000);
  
  // Read directly from app.integrations (avoid VIEW if possible for performance)
  // The timeout is now handled at the fetch level in createAdminClient
  const { data, error } = await admin
   .from('integrations')
   .select('id, provider, status, last_synced_at, last_error, updated_at')
   .eq('id', integrationId)
   .eq('tenant_id', tenantId)
   .maybeSingle();
  
  if (error) {
   console.error('❌ Status query error:', {
    error,
    integrationId,
    tenantId,
    errorCode: (error as any).code,
    errorMessage: error.message,
    errorDetails: (error as any).details,
    errorHint: (error as any).hint
   });
   
   // Classify 503 as retryable in client
   const msg = extractErrorMessage(error);
   const status = (error as any).code === '503' || error.message?.includes('timeout') || error.message?.includes('aborted')
    ? 503
    : 500;
   
   return NextResponse.json({ 
    error: 'Kunde inte hämta integrationsstatus.',
    detail: msg,
    code: (error as any).code
   }, { status });
  }
  
  if (!data) {
   return NextResponse.json({ error: 'Integration hittades inte.' }, { status: 404 });
  }
  
  // Hämta statistik (med timeout-hantering)
  // Om integration_mappings tabellen inte finns, fortsätt utan statistik
  let customersCount = 0;
  let invoicesCount = 0;
  
    try {
     const [customersResult, invoicesResult] = await Promise.allSettled([
      admin
       .from('integration_mappings')
       .select('*', { count: 'exact', head: true })
       .eq('integration_id', integrationId)
       .eq('entity_type', 'customer')
       .eq('tenant_id', tenantId),
      admin
       .from('integration_mappings')
       .select('*', { count: 'exact', head: true })
       .eq('integration_id', integrationId)
       .eq('entity_type', 'invoice')
       .eq('tenant_id', tenantId)
     ]);
   
   // Handle customers count
   if (customersResult.status === 'fulfilled' && customersResult.value) {
    const { data, error, count } = customersResult.value;
    if (error) {
     console.warn('⚠️ Error fetching customers count:', error);
    } else {
     customersCount = count ?? 0;
    }
   } else if (customersResult.status === 'rejected') {
    console.warn('⚠️ Customers count query rejected:', customersResult.reason);
   }
   
   // Handle invoices count
   if (invoicesResult.status === 'fulfilled' && invoicesResult.value) {
    const { data, error, count } = invoicesResult.value;
    if (error) {
     console.warn('⚠️ Error fetching invoices count:', error);
    } else {
     invoicesCount = count ?? 0;
    }
   } else if (invoicesResult.status === 'rejected') {
    console.warn('⚠️ Invoices count query rejected:', invoicesResult.reason);
   }
  } catch (statsError) {
   console.warn('⚠️ Could not fetch statistics:', statsError);
   // Fortsätt utan statistik om det misslyckas
  }
  
  // Return response with cache headers (client-side caching via React Query)
  const response = NextResponse.json({
   ...data,
   statistics: {
    customers: customersCount,
    invoices: invoicesCount,
   }
  });
  
  // Cache for 30s on client (React Query can override this)
  response.headers.set('Cache-Control', 'private, max-age=30');
  
  return response;
 } catch (e: any) {
  console.error('💥 Exception in status route:', e);
  
  // AbortError → map to 503 with tips
  const isAbortError = e?.name === 'AbortError' || e?.message?.includes('aborted');
  const msg = isAbortError
   ? 'Tidsgränsen för statusanropet överskreds.'
   : (e?.message || 'Internt fel i status-endpoint.');
  
  const tips = [
   'Minska samtidiga status-anrop (polling högst var 30–60s).',
   'Undvik VIEWs för heta endpoints – läs från bas-tabellen.',
   'Öka timeout om nödvändigt (admin-klientens fetch-timeout).'
  ];
  
  const status = isAbortError ? 503 : 500;
  
  return NextResponse.json({ 
   error: msg,
   tips: isAbortError ? tips : undefined
  }, { status });
 }
}

