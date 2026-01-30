import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  try {
    const { tenantId, userId } = await req.json()

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID krävs' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create demo clients
    const demoClients = [
      {
        tenant_id: tenantId,
        name: 'Andersson Fastigheter AB',
        email: 'info@anderssonfastigheter.se',
        address: 'Kungsgatan 12, 111 43 Stockholm',
        org_number: '556123-4567',
        phone: '08-123 45 67',
      },
      {
        tenant_id: tenantId,
        name: 'Kalle Karlsson',
        email: 'kalle.karlsson@email.se',
        address: 'Björkvägen 8, 182 31 Danderyd',
        phone: '070-123 45 67',
      },
      {
        tenant_id: tenantId,
        name: 'BRF Solbacken',
        email: 'styrelsen@brfsolbacken.se',
        address: 'Solbackevägen 1-15, 141 52 Huddinge',
        org_number: '769601-2345',
        phone: '08-987 65 43',
      },
    ]

    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .insert(demoClients)
      .select()

    if (clientError) {
      console.error('Error creating demo clients:', clientError)
      return NextResponse.json({ error: 'Kunde inte skapa demo-kunder' }, { status: 500 })
    }

    // Get the admin employee for this tenant
    const { data: adminEmployee } = await supabase
      .from('employees')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('role', 'admin')
      .single()

    const employeeId = adminEmployee?.id

    // Create demo projects
    const today = new Date()
    const oneMonthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
    const twoWeeksAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14)
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate())
    
    const demoProjects = [
      {
        tenant_id: tenantId,
        client_id: clients[0].id,
        name: 'Köksrenovering Kungsgatan',
        status: 'active',
        price_model: 'hourly',
        hourly_rate: 450,
        budgeted_hours: 80,
        markup_percent: 15,
        start_date: twoWeeksAgo.toISOString().split('T')[0],
        site_address: 'Kungsgatan 12, 111 43 Stockholm',
      },
      {
        tenant_id: tenantId,
        client_id: clients[1].id,
        name: 'Badrumsrenovering Björkvägen',
        status: 'active',
        price_model: 'hourly',
        hourly_rate: 420,
        budgeted_hours: 60,
        markup_percent: 15,
        is_rot_rut: true,
        start_date: oneMonthAgo.toISOString().split('T')[0],
        site_address: 'Björkvägen 8, 182 31 Danderyd',
      },
      {
        tenant_id: tenantId,
        client_id: clients[2].id,
        name: 'Fasadrenovering BRF Solbacken',
        status: 'completed',
        price_model: 'fixed',
        budget: 250000,
        markup_percent: 12,
        start_date: threeMonthsAgo.toISOString().split('T')[0],
        end_date: oneMonthAgo.toISOString().split('T')[0],
        site_address: 'Solbackevägen 1-15, 141 52 Huddinge',
      },
    ]

    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .insert(demoProjects)
      .select()

    if (projectError) {
      console.error('Error creating demo projects:', projectError)
      return NextResponse.json({ error: 'Kunde inte skapa demo-projekt' }, { status: 500 })
    }

    // Create demo time entries if we have an employee
    if (employeeId && projects.length >= 2) {
      const demoTimeEntries = []
      
      // Generate time entries for the last two weeks for active projects
      for (let i = 0; i < 10; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        
        // Skip weekends
        if (date.getDay() === 0 || date.getDay() === 6) continue
        
        const projectIndex = i % 2 // Alternate between first two projects
        const hours = 6 + Math.floor(Math.random() * 3) // 6-8 hours
        
        demoTimeEntries.push({
          tenant_id: tenantId,
          employee_id: employeeId,
          project_id: projects[projectIndex].id,
          date: date.toISOString().split('T')[0],
          hours_total: hours,
          amount_total: hours * (projectIndex === 0 ? 450 : 420),
          ob_type: 'normal',
          is_billed: i > 7, // Older entries are billed
          description: i % 3 === 0 ? 'Rivning och förberedelse' : i % 3 === 1 ? 'Installation' : 'Efterarbete',
        })
      }

      if (demoTimeEntries.length > 0) {
        await supabase.from('time_entries').insert(demoTimeEntries)
      }
    }

    // Create demo invoices
    const demoInvoices = [
      {
        tenant_id: tenantId,
        project_id: projects[2].id, // Completed project
        client_id: clients[2].id,
        customer_name: 'BRF Solbacken',
        amount: 250000,
        status: 'paid',
        number: 'F-2024-001',
        issue_date: oneMonthAgo.toISOString().split('T')[0],
        due_date: new Date(oneMonthAgo.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        tenant_id: tenantId,
        project_id: projects[0].id,
        client_id: clients[0].id,
        customer_name: 'Andersson Fastigheter AB',
        amount: 18000,
        status: 'sent',
        number: 'F-2024-002',
        issue_date: twoWeeksAgo.toISOString().split('T')[0],
        due_date: new Date(twoWeeksAgo.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
      {
        tenant_id: tenantId,
        project_id: projects[1].id,
        client_id: clients[1].id,
        customer_name: 'Kalle Karlsson',
        amount: 12600,
        status: 'draft',
        number: 'F-2024-003',
        issue_date: today.toISOString().split('T')[0],
        due_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      },
    ]

    await supabase.from('invoices').insert(demoInvoices)

    // Create a draft ROT application for the private customer
    const rotApplication = {
      tenant_id: tenantId,
      project_id: projects[1].id,
      client_id: clients[1].id,
      property_designation: 'Danderyd 5:123',
      work_type: 'Badrumsrenovering',
      work_cost_sek: 50000,
      material_cost_sek: 15000,
      total_cost_sek: 65000,
      status: 'draft',
    }

    await supabase.from('rot_applications').insert(rotApplication)

    return NextResponse.json({
      success: true,
      created: {
        clients: clients.length,
        projects: projects.length,
        invoices: demoInvoices.length,
      },
    })
  } catch (error: any) {
    console.error('Error seeding demo data:', error)
    return NextResponse.json(
      { error: error.message || 'Fel vid skapande av demo-data' },
      { status: 500 }
    )
  }
}
