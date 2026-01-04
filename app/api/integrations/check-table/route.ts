// app/api/integrations/check-table/route.ts
// Diagnostic route to check if integrations table exists
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/work-orders/helpers';

export async function GET() {
 try {
  const tenantId = await getTenantId();
  const admin = createAdminClient();
  
  console.log('🔍 Checking if integrations table exists...');
  
  // Test: Try to query the table (Supabase will use search_path to find it)
  const { data, error, count } = await admin
   .from('integrations')
   .select('*', { count: 'exact', head: true });
  
  if (error) {
   const errorInfo = {
    code: error.code,
    message: error.message,
    details: error.details,
    hint: error.hint
   };
   
   // Check if it's a "table does not exist" error
   const tableDoesNotExist = 
    error.code === '42P01' ||
    error.message?.toLowerCase().includes('does not exist') ||
    error.message?.toLowerCase().includes('relation') ||
    error.message?.toLowerCase().includes('no such table');
   
   return NextResponse.json({
    exists: false,
    error: errorInfo,
    tableDoesNotExist,
    tenantId: tenantId || 'NOT FOUND',
    instructions: tableDoesNotExist 
     ? 'Tabellen finns inte. Kör CREATE_INTEGRATIONS_TABLES.sql i Supabase SQL Editor.'
     : 'Okänt fel. Kontrollera error details ovan.'
   });
  }
  
  return NextResponse.json({
   exists: true,
   count: count || 0,
   tenantId: tenantId || 'NOT FOUND',
   message: `Tabellen finns och innehåller ${count || 0} rader för din tenant.`
  });
 } catch (e: any) {
  console.error('Exception in check-table route:', e);
  return NextResponse.json({ 
   exists: false,
   error: e.message,
   stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
  }, { status: 500 });
 }
}

