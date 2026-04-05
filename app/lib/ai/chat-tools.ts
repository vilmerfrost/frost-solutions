import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Tool definitions in OpenAI function-calling format.
 * Used by the chat route to let the AI query real tenant data.
 */
export const CHAT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_projects',
      description:
        'Hämta lista över projekt med budget och status. Använd när användaren frågar om projekt, projektöversikt eller projektlistor.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['planned', 'active', 'completed', 'archived'],
            description: 'Filtrera på projektstatus',
          },
          limit: { type: 'number', description: 'Max antal projekt (standard: 10)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_project_details',
      description:
        'Hämta detaljerad info om ett specifikt projekt: budget, timmar, fakturor. Använd när användaren frågar om ett specifikt projekt.',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Projekt-ID (UUID)' },
        },
        required: ['project_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_time_entries',
      description:
        'Hämta tidsrapporter. Filtrera på projekt, anställd eller datumintervall. Använd när användaren frågar om tid, timmar eller rapporter.',
      parameters: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'Filtrera på projekt-ID' },
          employee_id: { type: 'string', description: 'Filtrera på anställd-ID' },
          start_date: { type: 'string', description: 'Startdatum (YYYY-MM-DD)' },
          end_date: { type: 'string', description: 'Slutdatum (YYYY-MM-DD)' },
          limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_invoices',
      description:
        'Hämta fakturor med status och belopp. Använd när användaren frågar om fakturor, betalningar eller utestående belopp.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled'],
            description: 'Filtrera på fakturastatus',
          },
          project_id: { type: 'string', description: 'Filtrera på projekt-ID' },
          limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_employees',
      description:
        'Hämta lista över anställda med roller och kontaktinfo. Använd när användaren frågar om personal, team eller resurser.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_work_orders',
      description:
        'Hämta arbetsordrar. Använd när användaren frågar om arbetsordrar, uppgifter eller jobb.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['new', 'assigned', 'in_progress', 'completed', 'cancelled'],
            description: 'Filtrera på status',
          },
          project_id: { type: 'string', description: 'Filtrera på projekt-ID' },
          limit: { type: 'number', description: 'Max antal (standard: 20)' },
        },
      },
    },
  },
]

export async function executeTool(
  tenantId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const admin = createAdminClient()

  switch (toolName) {
    case 'get_projects': {
      let query = admin
        .from('projects')
        .select('id, name, status, budget, hourly_rate, start_date, end_date, client_id, price_model')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit((args.limit as number) || 10)
      if (args.status) query = query.eq('status', args.status as string)
      const { data, error } = await query
      if (error) return { error: error.message }
      return { projects: data, count: data?.length ?? 0 }
    }

    case 'get_project_details': {
      const pid = args.project_id as string
      const [projectRes, timeRes, invoiceRes] = await Promise.all([
        admin.from('projects').select('*').eq('tenant_id', tenantId).eq('id', pid).single(),
        admin
          .from('time_entries')
          .select('hours_total, amount_total, employee_id, date')
          .eq('tenant_id', tenantId)
          .eq('project_id', pid),
        admin
          .from('invoices')
          .select('id, number, total_amount, status, issue_date')
          .eq('tenant_id', tenantId)
          .eq('project_id', pid),
      ])
      if (projectRes.error) return { error: projectRes.error.message }

      const entries = timeRes.data ?? []
      const totalHours = entries.reduce((s, e) => s + (Number(e.hours_total) || 0), 0)
      const totalCost = entries.reduce((s, e) => s + (Number(e.amount_total) || 0), 0)
      const invoices = invoiceRes.data ?? []

      return {
        project: projectRes.data,
        summary: {
          totalHours: Math.round(totalHours * 10) / 10,
          totalCost: Math.round(totalCost),
          timeEntryCount: entries.length,
          invoiceCount: invoices.length,
          invoicedAmount: invoices.reduce((s, i) => s + (Number(i.total_amount) || 0), 0),
        },
        invoices,
      }
    }

    case 'get_time_entries': {
      let query = admin
        .from('time_entries')
        .select('id, date, hours_total, amount_total, description, employee_id, project_id, approval_status')
        .eq('tenant_id', tenantId)
        .order('date', { ascending: false })
        .limit((args.limit as number) || 20)
      if (args.project_id) query = query.eq('project_id', args.project_id as string)
      if (args.employee_id) query = query.eq('employee_id', args.employee_id as string)
      if (args.start_date) query = query.gte('date', args.start_date as string)
      if (args.end_date) query = query.lte('date', args.end_date as string)
      const { data, error } = await query
      if (error) return { error: error.message }
      const totalHours = (data ?? []).reduce((s, e) => s + (Number(e.hours_total) || 0), 0)
      return { timeEntries: data, count: data?.length ?? 0, totalHours: Math.round(totalHours * 10) / 10 }
    }

    case 'get_invoices': {
      let query = admin
        .from('invoices')
        .select('id, number, total_amount, status, issue_date, due_date, project_id, client_id')
        .eq('tenant_id', tenantId)
        .order('issue_date', { ascending: false })
        .limit((args.limit as number) || 20)
      if (args.status) query = query.eq('status', args.status as string)
      if (args.project_id) query = query.eq('project_id', args.project_id as string)
      const { data, error } = await query
      if (error) return { error: error.message }
      const totalAmount = (data ?? []).reduce((s, i) => s + (Number(i.total_amount) || 0), 0)
      return { invoices: data, count: data?.length ?? 0, totalAmount }
    }

    case 'get_employees': {
      const { data, error } = await admin
        .from('employees')
        .select('id, name, email, role, default_rate_sek')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .limit((args.limit as number) || 20)
      if (error) return { error: error.message }
      return { employees: data, count: data?.length ?? 0 }
    }

    case 'get_work_orders': {
      let query = admin
        .from('work_orders')
        .select('id, number, title, status, priority, assigned_to, scheduled_date, project_id')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit((args.limit as number) || 20)
      if (args.status) query = query.eq('status', args.status as string)
      if (args.project_id) query = query.eq('project_id', args.project_id as string)
      const { data, error } = await query
      if (error) return { error: error.message }
      return { workOrders: data, count: data?.length ?? 0 }
    }

    default:
      return { error: `Okänt verktyg: ${toolName}` }
  }
}
