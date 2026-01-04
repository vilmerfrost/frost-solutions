// app/api/employees/list/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { getTenantId } from '@/lib/serverTenant';
import { extractErrorMessage } from '@/lib/errorUtils';

/**
 * GET /api/employees/list
 * Hämtar alla anställda för aktuell tenant
 * Använder service role för att kringgå RLS-problem
 */
export async function GET(req: NextRequest) {
 try {
  console.log('🔍 GET /api/employees/list - Starting request');
  
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError) {
   console.error('❌ Auth error:', authError);
   return NextResponse.json({ error: 'Authentication error', details: authError.message }, { status: 401 });
  }

  if (!user) {
   console.error('❌ No user found');
   return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  console.log('✅ User authenticated:', user.id, user.email);

  let tenantId = await getTenantId();
  
  // Fallback: Try to get tenant from employees table if not in JWT
  if (!tenantId) {
   console.log('⚠️ No tenant in JWT, trying to get from employees table');
   const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
   const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
   
   if (supabaseUrl && serviceKey) {
    try {
     const adminSupabaseTemp = createAdminClient(supabaseUrl, serviceKey);
     
     const { data: employee, error: empError } = await adminSupabaseTemp
      .from('employees')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .maybeSingle();
     
     if (empError) {
      console.warn('⚠️ Error getting tenant from employees:', empError.message);
     } else if (employee?.tenant_id) {
      tenantId = employee.tenant_id;
      console.log('✅ Found tenant from employees table:', tenantId);
     } else {
      console.warn('⚠️ No employee record found for user:', user.id);
     }
    } catch (fallbackError) {
     console.warn('⚠️ Fallback tenant lookup failed:', fallbackError);
    }
   } else {
    console.warn('⚠️ Cannot use fallback - missing Supabase config');
   }
  }
  
  if (!tenantId) {
   console.error('❌ No tenant found for user:', user.id);
   return NextResponse.json({ 
    error: 'No tenant found', 
    userId: user.id,
    suggestion: 'Make sure you have completed onboarding or have an employee record'
   }, { status: 403 });
  }

  console.log('✅ Tenant ID:', tenantId);

  // Use service role for reliable access
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
   console.error('❌ Service role key not configured. URL:', !!supabaseUrl, 'Key:', !!serviceKey);
   return NextResponse.json({ 
    error: 'Service role key not configured',
    hasUrl: !!supabaseUrl,
    hasKey: !!serviceKey
   }, { status: 500 });
  }

  console.log('✅ Creating admin client');
  const adminSupabase = createAdminClient(supabaseUrl, serviceKey);

  console.log('🔍 Querying employees for tenant:', tenantId);
  const { data: employees, error } = await adminSupabase
   .from('employees')
   .select('id, full_name, email, role, base_rate_sek, name, auth_user_id')
   .eq('tenant_id', tenantId)
   .order('full_name', { ascending: true });

  if (error) {
   console.error('❌ Error fetching employees:', error);
   console.error('❌ Error details:', JSON.stringify(error, null, 2));
   return NextResponse.json({ 
    error: extractErrorMessage(error),
    details: error.message,
    code: error.code,
    hint: error.hint
   }, { status: 500 });
  }

  console.log('✅ Found', employees?.length || 0, 'employees');
  
  // Map base_rate_sek to default_rate_sek for backward compatibility
  const mappedEmployees = (employees || []).map((emp: any) => ({
   ...emp,
   default_rate_sek: emp.base_rate_sek ?? emp.default_rate_sek,
  }));
  
  return NextResponse.json({ employees: mappedEmployees });
 } catch (error) {
  console.error('❌ Unexpected error in GET /api/employees/list:', error);
  console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
  return NextResponse.json({ 
   error: error instanceof Error ? error.message : String(error),
   type: error instanceof Error ? error.constructor.name : typeof error
  }, { status: 500 });
 }
}

