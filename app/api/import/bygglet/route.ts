// app/api/import/bygglet/route.ts
// API route for importing Bygglet CSV data
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { getTenantId } from '@/lib/serverTenant';
import { createClient } from '@/utils/supabase/server';
import {
  parseCSV,
  validateImportData,
  ImportDataType,
  ByggletProject,
  ByggletTimeEntry,
  ByggletEmployee,
  ByggletClient,
  ByggletInvoice,
} from '@/lib/import/bygglet-parser';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow longer execution for large imports

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const tenantId = await getTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad eller tenant saknas' },
        { status: 401 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Ej inloggad' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { csvContent, dataType, columnMapping } = body as {
      csvContent: string;
      dataType: ImportDataType;
      columnMapping?: Record<string, string>;
    };

    if (!csvContent) {
      return NextResponse.json(
        { success: false, error: 'CSV-innehåll saknas' },
        { status: 400 }
      );
    }

    if (!dataType) {
      return NextResponse.json(
        { success: false, error: 'Datatyp saknas (projects, time_entries, employees, clients, invoices)' },
        { status: 400 }
      );
    }

    // Parse CSV
    const parseResult = parseCSV(csvContent, dataType, columnMapping);

    if (!parseResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Kunde inte tolka CSV-filen',
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      }, { status: 400 });
    }

    // Validate data
    const validation = validateImportData(parseResult.data, dataType);
    if (!validation.valid) {
      return NextResponse.json({
        success: false,
        error: 'Valideringsfel',
        errors: validation.errors,
        warnings: parseResult.warnings,
        previewData: parseResult.data.slice(0, 5), // Return first 5 rows for preview
      }, { status: 400 });
    }

    // Import data based on type
    const admin = createAdminClient();
    let result: ImportResult;

    switch (dataType) {
      case 'projects':
        result = await importProjects(admin, tenantId, parseResult.data as ByggletProject[]);
        break;
      case 'time_entries':
        result = await importTimeEntries(admin, tenantId, parseResult.data as ByggletTimeEntry[]);
        break;
      case 'employees':
        result = await importEmployees(admin, tenantId, parseResult.data as ByggletEmployee[]);
        break;
      case 'clients':
        result = await importClients(admin, tenantId, parseResult.data as ByggletClient[]);
        break;
      case 'invoices':
        result = await importInvoices(admin, tenantId, parseResult.data as ByggletInvoice[]);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Okänd datatyp' },
          { status: 400 }
        );
    }

    // Log import activity
    try {
      await admin.from('audit_logs').insert({
        tenant_id: tenantId,
        user_id: user.id,
        action: 'import',
        resource_type: dataType,
        details: {
          source: 'bygglet_csv',
          rowCount: parseResult.rowCount,
          imported: result.imported,
          errors: result.errors.length,
        },
      });
    } catch {
      // Don't fail if audit log fails
    }

    return NextResponse.json({
      success: result.success,
      imported: result.imported,
      total: parseResult.rowCount,
      errors: result.errors,
      warnings: [...parseResult.warnings, ...result.warnings],
    });

  } catch (error: any) {
    console.error('[Import] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Importfel' },
      { status: 500 }
    );
  }
}

// Import projects
async function importProjects(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  projects: ByggletProject[]
): Promise<ImportResult> {
  const result: ImportResult = { success: false, imported: 0, errors: [], warnings: [] };

  // Get existing clients for matching
  const { data: existingClients } = await admin
    .from('clients')
    .select('id, name')
    .eq('tenant_id', tenantId);
  
  const clientMap = new Map(existingClients?.map(c => [c.name.toLowerCase(), c.id]) || []);

  for (const project of projects) {
    try {
      // Find or create client
      let clientId: string | null = null;
      if (project.customer) {
        clientId = clientMap.get(project.customer.toLowerCase()) || null;
        
        if (!clientId) {
          // Create client
          const { data: newClient, error: clientError } = await admin
            .from('clients')
            .insert({
              tenant_id: tenantId,
              name: project.customer,
            })
            .select('id')
            .single();
          
          if (newClient) {
            clientId = newClient.id;
            clientMap.set(project.customer.toLowerCase(), clientId);
          } else if (clientError) {
            result.warnings.push(`Kunde inte skapa kund "${project.customer}": ${clientError.message}`);
          }
        }
      }

      // Create project
      const { error: projectError } = await admin
        .from('projects')
        .insert({
          tenant_id: tenantId,
          name: project.name,
          client_id: clientId,
          budget_hours: project.budget_hours || null,
          hourly_rate: project.hourly_rate || null,
          status: mapProjectStatus(project.status),
          start_date: project.start_date || null,
          end_date: project.end_date || null,
          description: project.description || null,
          source: 'bygglet_import',
        });

      if (projectError) {
        result.errors.push(`Projekt "${project.name}": ${projectError.message}`);
      } else {
        result.imported++;
      }
    } catch (e: any) {
      result.errors.push(`Projekt "${project.name}": ${e.message}`);
    }
  }

  result.success = result.imported > 0;
  return result;
}

// Import time entries
async function importTimeEntries(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  entries: ByggletTimeEntry[]
): Promise<ImportResult> {
  const result: ImportResult = { success: false, imported: 0, errors: [], warnings: [] };

  // Get projects and employees for matching
  const { data: projects } = await admin
    .from('projects')
    .select('id, name')
    .eq('tenant_id', tenantId);
  
  const { data: employees } = await admin
    .from('employees')
    .select('id, name')
    .eq('tenant_id', tenantId);

  const projectMap = new Map(projects?.map(p => [p.name.toLowerCase(), p.id]) || []);
  const employeeMap = new Map(employees?.map(e => [e.name.toLowerCase(), e.id]) || []);

  for (const entry of entries) {
    try {
      const projectId = projectMap.get(entry.project.toLowerCase());
      const employeeId = employeeMap.get(entry.employee.toLowerCase());

      if (!projectId) {
        result.errors.push(`Tidrapport ${entry.date}: Projekt "${entry.project}" finns inte`);
        continue;
      }

      if (!employeeId) {
        result.errors.push(`Tidrapport ${entry.date}: Anställd "${entry.employee}" finns inte`);
        continue;
      }

      const { error } = await admin
        .from('time_entries')
        .insert({
          tenant_id: tenantId,
          project_id: projectId,
          employee_id: employeeId,
          date: entry.date,
          hours_total: entry.hours,
          type: mapEntryType(entry.type),
          start_time: entry.start_time || null,
          end_time: entry.end_time || null,
          description: entry.description || null,
          source: 'bygglet_import',
        });

      if (error) {
        result.errors.push(`Tidrapport ${entry.date}: ${error.message}`);
      } else {
        result.imported++;
      }
    } catch (e: any) {
      result.errors.push(`Tidrapport ${entry.date}: ${e.message}`);
    }
  }

  result.success = result.imported > 0;
  return result;
}

// Import employees
async function importEmployees(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  employees: ByggletEmployee[]
): Promise<ImportResult> {
  const result: ImportResult = { success: false, imported: 0, errors: [], warnings: [] };

  // Check for existing employees by email
  const { data: existingEmployees } = await admin
    .from('employees')
    .select('email')
    .eq('tenant_id', tenantId);
  
  const existingEmails = new Set(existingEmployees?.map(e => e.email?.toLowerCase()) || []);

  for (const emp of employees) {
    try {
      if (emp.email && existingEmails.has(emp.email.toLowerCase())) {
        result.warnings.push(`Anställd "${emp.name}": E-post "${emp.email}" finns redan, hoppar över`);
        continue;
      }

      const { error } = await admin
        .from('employees')
        .insert({
          tenant_id: tenantId,
          name: emp.name,
          email: emp.email || null,
          phone: emp.phone || null,
          hourly_rate: emp.hourly_rate || null,
          role: emp.role || 'employee',
          personal_number: emp.personal_number || null,
          source: 'bygglet_import',
        });

      if (error) {
        result.errors.push(`Anställd "${emp.name}": ${error.message}`);
      } else {
        result.imported++;
        if (emp.email) {
          existingEmails.add(emp.email.toLowerCase());
        }
      }
    } catch (e: any) {
      result.errors.push(`Anställd "${emp.name}": ${e.message}`);
    }
  }

  result.success = result.imported > 0;
  return result;
}

// Import clients
async function importClients(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  clients: ByggletClient[]
): Promise<ImportResult> {
  const result: ImportResult = { success: false, imported: 0, errors: [], warnings: [] };

  // Check for existing clients by name
  const { data: existingClients } = await admin
    .from('clients')
    .select('name')
    .eq('tenant_id', tenantId);
  
  const existingNames = new Set(existingClients?.map(c => c.name.toLowerCase()) || []);

  for (const client of clients) {
    try {
      if (existingNames.has(client.name.toLowerCase())) {
        result.warnings.push(`Kund "${client.name}": Finns redan, hoppar över`);
        continue;
      }

      const { error } = await admin
        .from('clients')
        .insert({
          tenant_id: tenantId,
          name: client.name,
          contact_name: client.contact_person || null,
          email: client.email || null,
          phone: client.phone || null,
          address: client.address || null,
          city: client.city || null,
          postal_code: client.postal_code || null,
          org_number: client.org_number || null,
          source: 'bygglet_import',
        });

      if (error) {
        result.errors.push(`Kund "${client.name}": ${error.message}`);
      } else {
        result.imported++;
        existingNames.add(client.name.toLowerCase());
      }
    } catch (e: any) {
      result.errors.push(`Kund "${client.name}": ${e.message}`);
    }
  }

  result.success = result.imported > 0;
  return result;
}

// Import invoices
async function importInvoices(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  invoices: ByggletInvoice[]
): Promise<ImportResult> {
  const result: ImportResult = { success: false, imported: 0, errors: [], warnings: [] };

  // Get clients and projects for matching
  const { data: clients } = await admin
    .from('clients')
    .select('id, name')
    .eq('tenant_id', tenantId);
  
  const { data: projects } = await admin
    .from('projects')
    .select('id, name')
    .eq('tenant_id', tenantId);

  const clientMap = new Map(clients?.map(c => [c.name.toLowerCase(), c.id]) || []);
  const projectMap = new Map(projects?.map(p => [p.name.toLowerCase(), p.id]) || []);

  for (const invoice of invoices) {
    try {
      const clientId = clientMap.get(invoice.customer.toLowerCase());
      const projectId = invoice.project ? projectMap.get(invoice.project.toLowerCase()) : null;

      if (!clientId) {
        result.errors.push(`Faktura "${invoice.invoice_number}": Kund "${invoice.customer}" finns inte`);
        continue;
      }

      const { error } = await admin
        .from('invoices')
        .insert({
          tenant_id: tenantId,
          invoice_number: invoice.invoice_number,
          client_id: clientId,
          project_id: projectId,
          total_amount: invoice.amount,
          invoice_date: invoice.date || new Date().toISOString().split('T')[0],
          due_date: invoice.due_date || null,
          status: mapInvoiceStatus(invoice.status),
          source: 'bygglet_import',
        });

      if (error) {
        result.errors.push(`Faktura "${invoice.invoice_number}": ${error.message}`);
      } else {
        result.imported++;
      }
    } catch (e: any) {
      result.errors.push(`Faktura "${invoice.invoice_number}": ${e.message}`);
    }
  }

  result.success = result.imported > 0;
  return result;
}

// Helper functions for status mapping
function mapProjectStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'aktiv': 'active',
    'active': 'active',
    'pågående': 'active',
    'klar': 'completed',
    'completed': 'completed',
    'avslutad': 'completed',
    'arkiverad': 'archived',
    'archived': 'archived',
  };
  return statusMap[status?.toLowerCase()] || 'active';
}

function mapEntryType(type: string): string {
  const typeMap: Record<string, string> = {
    'arbete': 'work',
    'work': 'work',
    'normal': 'work',
    'övertid': 'overtime',
    'overtime': 'overtime',
    'ob': 'ob',
    'natt': 'night',
    'night': 'night',
    'helg': 'weekend',
    'weekend': 'weekend',
  };
  return typeMap[type?.toLowerCase()] || 'work';
}

function mapInvoiceStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'utkast': 'draft',
    'draft': 'draft',
    'skickad': 'sent',
    'sent': 'sent',
    'betald': 'paid',
    'paid': 'paid',
    'förfallen': 'overdue',
    'overdue': 'overdue',
    'makulerad': 'cancelled',
    'cancelled': 'cancelled',
  };
  return statusMap[status?.toLowerCase()] || 'draft';
}
