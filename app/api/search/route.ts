import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
 try {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
   return NextResponse.json(
    { success: false, error: 'Unauthorized' },
    { status: 401 }
   );
  }

  const tenantId = await getTenantId();
  if (!tenantId) {
   return NextResponse.json(
    { success: false, error: 'No tenant found' },
    { status: 400 }
   );
  }

  const body = await req.json();
  const { query, resource, filters } = body;

  if (!query || query.length < 2) {
   return NextResponse.json(
    { success: false, error: 'Query must be at least 2 characters' },
    { status: 400 }
   );
  }

  const admin = createAdminClient();
  const results: any = {};
  const queryLower = query.toLowerCase().trim();

  // Search projects
  if (!resource || resource === 'projects') {
   // Use case-insensitive ilike for reliable search (works even without search_text column)
   let projectsQuery = admin
    .from('projects')
    .select('id, name, status, created_at')
    .eq('tenant_id', tenantId) // 👈 Tenant filter FIRST for better query plan
    .ilike('name', `%${queryLower}%`)
    .order('created_at', { ascending: false })
    .limit(20);

   // Apply filters
   if (filters?.status) {
    const statusArray = Array.isArray(filters.status) ? filters.status : [filters.status];
    projectsQuery = projectsQuery.in('status', statusArray);
   }

   const { data: projects, error: projectsError } = await projectsQuery;

   if (!projectsError) {
    results.projects = projects || [];
   } else {
    console.error('Projects search error:', projectsError);
    results.projects = [];
   }
  }

  // Search clients
  if (!resource || resource === 'clients') {
   const { data: clients, error: clientsError } = await admin
    .from('clients')
    .select('id, name, org_number')
    .eq('tenant_id', tenantId) // 👈 Tenant filter FIRST
    .or(`name.ilike.%${queryLower}%,org_number.ilike.%${queryLower}%`);

   if (!clientsError) {
    results.clients = (clients || []).slice(0, 20);
   } else {
    console.error('Clients search error:', clientsError);
    results.clients = [];
   }
  }

  // Search invoices (simple text search on amount, customer_name)
  if (!resource || resource === 'invoices') {
   const { data: invoices, error: invoicesError } = await admin
    .from('invoices')
    .select('id, number, amount, customer_name, status, issue_date')
    .eq('tenant_id', tenantId) // 👈 Tenant filter FIRST
    .or(`customer_name.ilike.%${queryLower}%,number.ilike.%${queryLower}%`)
    .order('issue_date', { ascending: false })
    .limit(20);

   if (!invoicesError) {
    results.invoices = invoices || [];
   } else {
    console.error('Invoices search error:', invoicesError);
    results.invoices = [];
   }
  }

  // Debug logging
  console.log('🔍 Search API results:', {
   query: queryLower,
   projects: results.projects?.length || 0,
   clients: results.clients?.length || 0,
   invoices: results.invoices?.length || 0,
  });

  return NextResponse.json({
   success: true,
   data: results,
   query,
  });
 } catch (error: any) {
  console.error('Search error:', error);
  return NextResponse.json(
   { success: false, error: error.message || 'Search failed' },
   { status: 500 }
  );
 }
}

