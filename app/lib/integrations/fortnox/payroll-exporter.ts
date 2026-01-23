// app/lib/integrations/fortnox/payroll-exporter.ts
// Exports payroll data to Fortnox API

import { getValidToken } from './oauth';
import { createAdminClient } from '@/utils/supabase/admin';

const FORTNOX_API_BASE = 'https://api.fortnox.se/3';

interface FortnoxEmployee {
  PersonalIdentityNumber?: string;
  FirstName: string;
  LastName: string;
  Email?: string;
  Phone?: string;
  EmploymentDate?: string;
  MonthlySalary?: number;
  HourlyPay?: number;
}

interface PayrollData {
  employeeId: string;
  employeeName: string;
  personalNumber?: string;
  email?: string;
  totalHours: number;
  normalHours: number;
  overtimeHours: number;
  obHours: number;
  grossPay: number;
  hourlyRate: number;
  month: string;
}

interface ExportResult {
  success: boolean;
  exported: number;
  errors: string[];
  warnings: string[];
}

/**
 * Make authenticated request to Fortnox API
 */
async function fortnoxFetch(
  integrationId: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getValidToken(integrationId);
  
  const response = await fetch(`${FORTNOX_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

/**
 * Get employees from Fortnox
 */
export async function getFortnoxEmployees(integrationId: string): Promise<any[]> {
  const response = await fortnoxFetch(integrationId, '/employees');
  
  if (!response.ok) {
    throw new Error(`Failed to get employees from Fortnox: ${await response.text()}`);
  }

  const data = await response.json();
  return data.Employees || [];
}

/**
 * Create or update employee in Fortnox
 */
export async function upsertFortnoxEmployee(
  integrationId: string,
  employee: FortnoxEmployee
): Promise<any> {
  // First try to find existing employee by personal number
  if (employee.PersonalIdentityNumber) {
    try {
      const searchResponse = await fortnoxFetch(
        integrationId,
        `/employees?personalidentitynumber=${encodeURIComponent(employee.PersonalIdentityNumber)}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.Employees?.length > 0) {
          // Update existing
          const existingId = searchData.Employees[0].EmployeeId;
          const updateResponse = await fortnoxFetch(integrationId, `/employees/${existingId}`, {
            method: 'PUT',
            body: JSON.stringify({ Employee: employee }),
          });
          
          if (!updateResponse.ok) {
            throw new Error(`Failed to update employee: ${await updateResponse.text()}`);
          }
          
          return (await updateResponse.json()).Employee;
        }
      }
    } catch (e) {
      // Continue to create
    }
  }

  // Create new employee
  const createResponse = await fortnoxFetch(integrationId, '/employees', {
    method: 'POST',
    body: JSON.stringify({ Employee: employee }),
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create employee: ${await createResponse.text()}`);
  }

  return (await createResponse.json()).Employee;
}

/**
 * Export payroll data to Fortnox
 * This creates/updates employees and can optionally create salary transactions
 */
export async function exportPayrollToFortnox(
  integrationId: string,
  tenantId: string,
  month: string // Format: YYYY-MM
): Promise<ExportResult> {
  const result: ExportResult = {
    success: false,
    exported: 0,
    errors: [],
    warnings: [],
  };

  const admin = createAdminClient();

  // Get payroll data for the month
  const startDate = `${month}-01`;
  const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
    .toISOString().split('T')[0];

  // Get employees with time entries for the month
  const { data: timeEntries, error: timeError } = await admin
    .from('time_entries')
    .select(`
      id,
      employee_id,
      hours_total,
      type,
      date,
      employees (
        id,
        name,
        email,
        personal_number,
        hourly_rate,
        base_rate_sek
      )
    `)
    .eq('tenant_id', tenantId)
    .gte('date', startDate)
    .lte('date', endDate);

  if (timeError) {
    result.errors.push(`Kunde inte hämta tidsrapporter: ${timeError.message}`);
    return result;
  }

  if (!timeEntries || timeEntries.length === 0) {
    result.warnings.push(`Inga tidsrapporter för ${month}`);
    return result;
  }

  // Aggregate by employee
  const employeeData = new Map<string, PayrollData>();

  for (const entry of timeEntries) {
    const emp = entry.employees as any;
    if (!emp) continue;

    const existing = employeeData.get(emp.id) || {
      employeeId: emp.id,
      employeeName: emp.name,
      personalNumber: emp.personal_number,
      email: emp.email,
      totalHours: 0,
      normalHours: 0,
      overtimeHours: 0,
      obHours: 0,
      grossPay: 0,
      hourlyRate: emp.hourly_rate || emp.base_rate_sek || 0,
      month,
    };

    const hours = entry.hours_total || 0;
    existing.totalHours += hours;

    // Categorize hours by type
    switch (entry.type) {
      case 'overtime':
        existing.overtimeHours += hours;
        break;
      case 'ob':
      case 'night':
      case 'weekend':
        existing.obHours += hours;
        break;
      default:
        existing.normalHours += hours;
    }

    employeeData.set(emp.id, existing);
  }

  // Calculate gross pay
  for (const data of employeeData.values()) {
    // Basic calculation: normal * rate + overtime * 1.5 * rate + OB * 1.5 * rate
    const normalPay = data.normalHours * data.hourlyRate;
    const overtimePay = data.overtimeHours * data.hourlyRate * 1.5;
    const obPay = data.obHours * data.hourlyRate * 1.5;
    data.grossPay = normalPay + overtimePay + obPay;
  }

  // Export each employee to Fortnox
  for (const data of employeeData.values()) {
    try {
      // Parse name into first/last
      const nameParts = data.employeeName.trim().split(' ');
      const firstName = nameParts[0] || 'Unknown';
      const lastName = nameParts.slice(1).join(' ') || 'Unknown';

      const fortnoxEmployee: FortnoxEmployee = {
        FirstName: firstName,
        LastName: lastName,
        Email: data.email,
        PersonalIdentityNumber: data.personalNumber,
        HourlyPay: data.hourlyRate,
      };

      await upsertFortnoxEmployee(integrationId, fortnoxEmployee);
      result.exported++;

    } catch (e: any) {
      result.errors.push(`${data.employeeName}: ${e.message}`);
    }
  }

  // Log the export
  try {
    await admin.from('integration_logs').insert({
      tenant_id: tenantId,
      integration_id: integrationId,
      operation: 'export_payroll',
      status: result.exported > 0 ? 'success' : 'error',
      details: {
        month,
        employeeCount: employeeData.size,
        exported: result.exported,
        errors: result.errors.length,
      },
    });
  } catch {
    // Don't fail if logging fails
  }

  result.success = result.exported > 0;
  return result;
}

/**
 * Export invoice to Fortnox
 */
export async function exportInvoiceToFortnox(
  integrationId: string,
  tenantId: string,
  invoiceId: string
): Promise<{ success: boolean; fortnoxId?: string; error?: string }> {
  const admin = createAdminClient();

  // Get invoice with client and line items
  const { data: invoice, error } = await admin
    .from('invoices')
    .select(`
      *,
      clients (
        id,
        name,
        org_number,
        email,
        address,
        city,
        postal_code
      ),
      invoice_items (
        description,
        quantity,
        unit_price,
        amount
      )
    `)
    .eq('id', invoiceId)
    .eq('tenant_id', tenantId)
    .single();

  if (error || !invoice) {
    return { success: false, error: 'Faktura hittades inte' };
  }

  const client = invoice.clients as any;
  if (!client) {
    return { success: false, error: 'Kund saknas på fakturan' };
  }

  try {
    // First ensure customer exists in Fortnox
    let fortnoxCustomer: any;
    
    // Try to find existing customer
    if (client.org_number) {
      const searchResponse = await fortnoxFetch(
        integrationId,
        `/customers?organisationnumber=${encodeURIComponent(client.org_number)}`
      );
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.Customers?.length > 0) {
          fortnoxCustomer = searchData.Customers[0];
        }
      }
    }

    if (!fortnoxCustomer) {
      // Create new customer
      const customerResponse = await fortnoxFetch(integrationId, '/customers', {
        method: 'POST',
        body: JSON.stringify({
          Customer: {
            Name: client.name,
            OrganisationNumber: client.org_number,
            Email: client.email,
            Address1: client.address,
            City: client.city,
            ZipCode: client.postal_code,
          },
        }),
      });

      if (!customerResponse.ok) {
        return { success: false, error: `Kunde inte skapa kund: ${await customerResponse.text()}` };
      }

      fortnoxCustomer = (await customerResponse.json()).Customer;
    }

    // Create invoice
    const invoiceRows = (invoice.invoice_items as any[] || []).map((item: any) => ({
      Description: item.description,
      DeliveredQuantity: item.quantity || 1,
      Price: item.unit_price || item.amount,
    }));

    const invoiceResponse = await fortnoxFetch(integrationId, '/invoices', {
      method: 'POST',
      body: JSON.stringify({
        Invoice: {
          CustomerNumber: fortnoxCustomer.CustomerNumber,
          InvoiceDate: invoice.invoice_date,
          DueDate: invoice.due_date,
          InvoiceRows: invoiceRows.length > 0 ? invoiceRows : [{
            Description: 'Tjänster',
            DeliveredQuantity: 1,
            Price: invoice.total_amount,
          }],
        },
      }),
    });

    if (!invoiceResponse.ok) {
      return { success: false, error: `Kunde inte skapa faktura: ${await invoiceResponse.text()}` };
    }

    const fortnoxInvoice = (await invoiceResponse.json()).Invoice;

    // Update our invoice with Fortnox reference
    await admin
      .from('invoices')
      .update({ 
        external_id: fortnoxInvoice.DocumentNumber,
        external_system: 'fortnox',
      })
      .eq('id', invoiceId);

    return { success: true, fortnoxId: fortnoxInvoice.DocumentNumber };

  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

/**
 * Sync customers from Fortnox to Frost
 */
export async function syncCustomersFromFortnox(
  integrationId: string,
  tenantId: string
): Promise<{ synced: number; errors: string[] }> {
  const result = { synced: 0, errors: [] as string[] };
  const admin = createAdminClient();

  try {
    const customers = await fortnoxFetch(integrationId, '/customers');
    
    if (!customers.ok) {
      result.errors.push(`Kunde inte hämta kunder: ${await customers.text()}`);
      return result;
    }

    const data = await customers.json();
    const fortnoxCustomers = data.Customers || [];

    for (const fc of fortnoxCustomers) {
      try {
        // Check if customer exists by org number or name
        const { data: existing } = await admin
          .from('clients')
          .select('id')
          .eq('tenant_id', tenantId)
          .or(`org_number.eq.${fc.OrganisationNumber},name.eq.${fc.Name}`)
          .maybeSingle();

        if (existing) {
          // Update
          await admin
            .from('clients')
            .update({
              name: fc.Name,
              org_number: fc.OrganisationNumber,
              email: fc.Email,
              address: fc.Address1,
              city: fc.City,
              postal_code: fc.ZipCode,
              external_id: fc.CustomerNumber,
              external_system: 'fortnox',
            })
            .eq('id', existing.id);
        } else {
          // Create
          await admin
            .from('clients')
            .insert({
              tenant_id: tenantId,
              name: fc.Name,
              org_number: fc.OrganisationNumber,
              email: fc.Email,
              address: fc.Address1,
              city: fc.City,
              postal_code: fc.ZipCode,
              external_id: fc.CustomerNumber,
              external_system: 'fortnox',
            });
        }
        result.synced++;
      } catch (e: any) {
        result.errors.push(`${fc.Name}: ${e.message}`);
      }
    }
  } catch (e: any) {
    result.errors.push(e.message);
  }

  return result;
}
