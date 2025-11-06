// app/api/integrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';
import { extractErrorMessage } from '@/lib/errorUtils';

/**
 * GET /api/integrations
 * Lista alla integrationer för den nuvarande tenanten
 */
export async function GET(req: NextRequest) {
  try {
    console.log('🔍 GET /api/integrations - Starting...');
    
    const tenantId = await getTenantId();
    console.log('📋 Tenant ID:', tenantId || 'NOT FOUND');
    
    if (!tenantId) {
      console.error('❌ Tenant ID saknas - användaren är inte inloggad eller saknar tenant');
      return NextResponse.json({ error: 'Tenant ID saknas' }, { status: 401 });
    }

    const admin = createAdminClient();
    
    // Försök query integrations tabell
    // Notera: Tabellen ligger i app schema, men Supabase kan hitta den via search_path
    console.log('🔍 Querying integrations table for tenant:', tenantId);
    
    const { data, error } = await admin
      .from('integrations')
      .select('id, tenant_id, provider, status, scope, last_error, last_synced_at, created_at, updated_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // Om tabellen inte finns, returnera tom array (inte fel - tabellen kanske inte är skapad ännu)
    if (error) {
      console.error('❌ Supabase query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      
      // Om tabellen inte finns (42P01 = relation does not exist)
      if (error.code === '42P01' || 
          error.message?.toLowerCase().includes('does not exist') || 
          error.message?.toLowerCase().includes('relation') ||
          error.message?.toLowerCase().includes('no such table')) {
        console.warn('⚠️ Integrations table does not exist. Returning empty array.');
        console.warn('💡 Run CREATE_INTEGRATIONS_TABLES.sql in Supabase SQL Editor to create the table.');
        return NextResponse.json([]);
      }
      
      // Annat fel - logga och returnera error
      console.error('❌ Error fetching integrations:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return NextResponse.json({ 
        error: extractErrorMessage(error),
        details: error.message,
        code: error.code,
        hint: error.hint
      }, { status: 500 });
    }

    console.log('✅ Successfully fetched integrations:', data?.length || 0, 'items');
    
    // Filtrera bort dubbletter - visa endast en integration per provider
    // Prioritera: 1) Anslutna integrationer, 2) Senaste skapade
    if (data && data.length > 0) {
      const providerMap = new Map<string, typeof data[0]>();
      
      // Sortera integrationer: anslutna först, sedan efter created_at (nyaste först)
      const sorted = [...data].sort((a, b) => {
        // Anslutna integrationer först
        if (a.status === 'connected' && b.status !== 'connected') return -1;
        if (a.status !== 'connected' && b.status === 'connected') return 1;
        // Sedan sortera efter created_at (nyaste först)
        const aTime = new Date(a.created_at).getTime();
        const bTime = new Date(b.created_at).getTime();
        return bTime - aTime;
      });
      
      // Ta första integrationen per provider
      for (const integration of sorted) {
        if (!providerMap.has(integration.provider)) {
          providerMap.set(integration.provider, integration);
        }
      }
      
      const uniqueIntegrations = Array.from(providerMap.values());
      console.log('✅ Unique integrations after filtering:', uniqueIntegrations.length, 'items');
      return NextResponse.json(uniqueIntegrations);
    }
    
    return NextResponse.json(data || []);
  } catch (e: any) {
    console.error('💥 Exception in integrations route:', {
      message: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    });
    return NextResponse.json({ 
      error: extractErrorMessage(e),
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}

