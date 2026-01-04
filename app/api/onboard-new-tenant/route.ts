// /app/api/onboard-new-tenant/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
 // Prefer service envs for server-side operations, but fall back to public vars
 const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
 const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

 if (!supabaseUrl || !supabaseKey) {
  return new Response(JSON.stringify({ error: 'Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_* fallbacks)'}), { status: 500 })
 }

 const supabase = createClient(supabaseUrl, supabaseKey)

 // Ta emot kundinfo från frontend (JSON payload)
 const { name, org_nr, client, project, employee } = await req.json()

 // 1. Skapa tenant
 const { data: tenant, error: tenantError } = await supabase
  .from('tenants')
  .insert([{ name, org_nr, onboarded: true }])
  .select('user_id')
  .single()
 if (tenantError) return new Response(JSON.stringify(tenantError), { status: 400 })
 const tenantId = tenant.user_id

 // 2. Skapa klient
 const { data: newClient, error: clientError } = await supabase
  .from('clients')
  .insert([{ tenant_id: tenantId, ...client }])
  .select('id')
  .single()
 if (clientError) return new Response(JSON.stringify(clientError), { status: 400 })
 const clientId = newClient.id

 // 3. Skapa projekt
 // Build a project payload with only expected fields to avoid inserting
 // columns that may not exist in the schema (e.g. `budget`).
 const projectPayload: any = {
  tenant_id: tenantId,
  client_id: clientId,
  name: project?.name ?? `Projekt för ${name}`,
 }

 const { data: newProject, error: projectError } = await supabase
  .from('projects')
  .insert([projectPayload])
  .select('id')
  .single()
 if (projectError) return new Response(JSON.stringify(projectError), { status: 400 })
 const projectId = newProject.id

 // 4. Skapa anställd
 const { data: newEmp, error: empError } = await supabase
  .from('employees')
  .insert([{ tenant_id: tenantId, ...employee }])
  .select('id')
  .single()
 if (empError) return new Response(JSON.stringify(empError), { status: 400 })
 const employerId = newEmp.id

 // 5. Returnera allt till frontend
 return new Response(JSON.stringify({
  tenantId,
  clientId,
  projectId,
  employerId
 }), { status: 200 })
}
