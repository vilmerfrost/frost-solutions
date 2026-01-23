// app/lib/import/bygglet-parser.ts
// Parser for Bygglet CSV exports

import Papa from 'papaparse';

export interface ByggletProject {
  name: string;
  customer: string;
  budget_hours: number;
  hourly_rate: number;
  status: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface ByggletTimeEntry {
  date: string;
  employee: string;
  project: string;
  hours: number;
  type: string;
  start_time?: string;
  end_time?: string;
  description?: string;
}

export interface ByggletEmployee {
  name: string;
  email: string;
  phone?: string;
  hourly_rate?: number;
  role?: string;
  personal_number?: string;
}

export interface ByggletClient {
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  org_number?: string;
}

export interface ByggletInvoice {
  invoice_number: string;
  customer: string;
  amount: number;
  date: string;
  due_date?: string;
  status: string;
  project?: string;
}

export type ImportDataType = 'projects' | 'time_entries' | 'employees' | 'clients' | 'invoices';

export interface ParseResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  rowCount: number;
}

// Column mappings for different CSV formats
const COLUMN_MAPPINGS: Record<ImportDataType, Record<string, string[]>> = {
  projects: {
    name: ['name', 'namn', 'projektnamn', 'project', 'projekt'],
    customer: ['customer', 'kund', 'kundnamn', 'client', 'klient'],
    budget_hours: ['budget_hours', 'budget', 'budgettimmar', 'timmar', 'hours'],
    hourly_rate: ['hourly_rate', 'timpris', 'rate', 'pris'],
    status: ['status', 'status'],
    start_date: ['start_date', 'startdatum', 'start', 'från'],
    end_date: ['end_date', 'slutdatum', 'end', 'till'],
    description: ['description', 'beskrivning', 'desc', 'anteckning'],
  },
  time_entries: {
    date: ['date', 'datum', 'dag'],
    employee: ['employee', 'anställd', 'namn', 'name', 'medarbetare'],
    project: ['project', 'projekt', 'projektnamn'],
    hours: ['hours', 'timmar', 'tid', 'antal'],
    type: ['type', 'typ', 'arbetstyp', 'kategori'],
    start_time: ['start_time', 'starttid', 'från', 'start'],
    end_time: ['end_time', 'sluttid', 'till', 'slut'],
    description: ['description', 'beskrivning', 'kommentar', 'anteckning'],
  },
  employees: {
    name: ['name', 'namn', 'fullständigt namn', 'full_name'],
    email: ['email', 'e-post', 'epost', 'mail'],
    phone: ['phone', 'telefon', 'tel', 'mobil'],
    hourly_rate: ['hourly_rate', 'timpris', 'lön', 'rate'],
    role: ['role', 'roll', 'befattning', 'position'],
    personal_number: ['personal_number', 'personnummer', 'ssn'],
  },
  clients: {
    name: ['name', 'namn', 'företagsnamn', 'company'],
    contact_person: ['contact_person', 'kontaktperson', 'kontakt'],
    email: ['email', 'e-post', 'epost', 'mail'],
    phone: ['phone', 'telefon', 'tel'],
    address: ['address', 'adress', 'gatuadress'],
    city: ['city', 'stad', 'ort'],
    postal_code: ['postal_code', 'postnummer', 'postnr'],
    org_number: ['org_number', 'organisationsnummer', 'orgnr'],
  },
  invoices: {
    invoice_number: ['invoice_number', 'fakturanummer', 'nr', 'number'],
    customer: ['customer', 'kund', 'kundnamn'],
    amount: ['amount', 'belopp', 'summa', 'total'],
    date: ['date', 'datum', 'fakturadatum'],
    due_date: ['due_date', 'förfallodatum', 'förfaller'],
    status: ['status', 'status'],
    project: ['project', 'projekt'],
  },
};

// Find the matching column in the CSV headers
function findColumn(headers: string[], possibleNames: string[]): string | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  for (const name of possibleNames) {
    const index = normalizedHeaders.indexOf(name.toLowerCase());
    if (index !== -1) {
      return headers[index];
    }
  }
  return null;
}

// Parse Swedish numbers (1 234,56 or 1234.56)
function parseSwedishNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  if (typeof value === 'number') return value;
  // Remove spaces and replace comma with dot
  const cleaned = value.toString().replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parse Swedish date formats (YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY)
function parseSwedishDate(value: string | null | undefined): string {
  if (!value) return '';
  
  // Already in ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  
  // DD/MM/YYYY or DD.MM.YYYY
  const match = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Try to parse as date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }
  
  return value;
}

// Generic CSV parser
export function parseCSV<T>(
  csvContent: string,
  dataType: ImportDataType,
  customMapping?: Record<string, string>
): ParseResult<T> {
  const result: ParseResult<T> = {
    success: false,
    data: [],
    errors: [],
    warnings: [],
    rowCount: 0,
  };

  // Parse CSV
  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim(),
  });

  if (parsed.errors.length > 0) {
    result.errors = parsed.errors.map(e => `Rad ${e.row}: ${e.message}`);
    // Don't fail completely on parse errors, continue with valid rows
  }

  const headers = parsed.meta.fields || [];
  const rows = parsed.data as Record<string, string>[];
  result.rowCount = rows.length;

  if (rows.length === 0) {
    result.errors.push('Filen innehåller inga rader');
    return result;
  }

  // Build column mapping
  const mapping = customMapping || {};
  const columnMappings = COLUMN_MAPPINGS[dataType];

  for (const [field, possibleNames] of Object.entries(columnMappings)) {
    if (!mapping[field]) {
      const foundColumn = findColumn(headers, possibleNames);
      if (foundColumn) {
        mapping[field] = foundColumn;
      }
    }
  }

  // Parse rows
  const parsedRows: T[] = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // Account for header row
    
    try {
      const parsedRow = parseRow(row, mapping, dataType, rowNum, result.warnings);
      if (parsedRow) {
        parsedRows.push(parsedRow as T);
      }
    } catch (e: any) {
      result.errors.push(`Rad ${rowNum}: ${e.message}`);
    }
  }

  result.data = parsedRows;
  result.success = parsedRows.length > 0;

  if (parsedRows.length < rows.length) {
    result.warnings.push(`${rows.length - parsedRows.length} rader kunde inte importeras`);
  }

  return result;
}

// Parse a single row based on data type
function parseRow(
  row: Record<string, string>,
  mapping: Record<string, string>,
  dataType: ImportDataType,
  rowNum: number,
  warnings: string[]
): any {
  const getValue = (field: string): string => {
    const column = mapping[field];
    return column ? (row[column] || '').trim() : '';
  };

  switch (dataType) {
    case 'projects': {
      const name = getValue('name');
      if (!name) {
        warnings.push(`Rad ${rowNum}: Projektnamn saknas, hoppar över`);
        return null;
      }
      return {
        name,
        customer: getValue('customer'),
        budget_hours: parseSwedishNumber(getValue('budget_hours')),
        hourly_rate: parseSwedishNumber(getValue('hourly_rate')),
        status: getValue('status') || 'active',
        start_date: parseSwedishDate(getValue('start_date')),
        end_date: parseSwedishDate(getValue('end_date')),
        description: getValue('description'),
      } as ByggletProject;
    }

    case 'time_entries': {
      const date = parseSwedishDate(getValue('date'));
      const employee = getValue('employee');
      const project = getValue('project');
      const hours = parseSwedishNumber(getValue('hours'));
      
      if (!date || !employee || !project) {
        warnings.push(`Rad ${rowNum}: Datum, anställd eller projekt saknas, hoppar över`);
        return null;
      }
      if (hours <= 0) {
        warnings.push(`Rad ${rowNum}: Ogiltigt antal timmar (${hours}), hoppar över`);
        return null;
      }
      
      return {
        date,
        employee,
        project,
        hours,
        type: getValue('type') || 'work',
        start_time: getValue('start_time'),
        end_time: getValue('end_time'),
        description: getValue('description'),
      } as ByggletTimeEntry;
    }

    case 'employees': {
      const name = getValue('name');
      const email = getValue('email');
      
      if (!name) {
        warnings.push(`Rad ${rowNum}: Namn saknas, hoppar över`);
        return null;
      }
      
      return {
        name,
        email,
        phone: getValue('phone'),
        hourly_rate: parseSwedishNumber(getValue('hourly_rate')),
        role: getValue('role') || 'employee',
        personal_number: getValue('personal_number'),
      } as ByggletEmployee;
    }

    case 'clients': {
      const name = getValue('name');
      
      if (!name) {
        warnings.push(`Rad ${rowNum}: Kundnamn saknas, hoppar över`);
        return null;
      }
      
      return {
        name,
        contact_person: getValue('contact_person'),
        email: getValue('email'),
        phone: getValue('phone'),
        address: getValue('address'),
        city: getValue('city'),
        postal_code: getValue('postal_code'),
        org_number: getValue('org_number'),
      } as ByggletClient;
    }

    case 'invoices': {
      const invoiceNumber = getValue('invoice_number');
      const customer = getValue('customer');
      const amount = parseSwedishNumber(getValue('amount'));
      
      if (!invoiceNumber || !customer) {
        warnings.push(`Rad ${rowNum}: Fakturanummer eller kund saknas, hoppar över`);
        return null;
      }
      
      return {
        invoice_number: invoiceNumber,
        customer,
        amount,
        date: parseSwedishDate(getValue('date')),
        due_date: parseSwedishDate(getValue('due_date')),
        status: getValue('status') || 'draft',
        project: getValue('project'),
      } as ByggletInvoice;
    }

    default:
      return null;
  }
}

// Detect data type from CSV headers
export function detectDataType(headers: string[]): ImportDataType | null {
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
  
  // Check for unique identifiers for each type
  const hasProjectFields = normalizedHeaders.some(h => 
    ['projektnamn', 'budget', 'budgettimmar'].includes(h)
  );
  const hasTimeEntryFields = normalizedHeaders.some(h =>
    ['timmar', 'starttid', 'sluttid'].includes(h)
  ) && normalizedHeaders.some(h => ['datum', 'date'].includes(h));
  const hasEmployeeFields = normalizedHeaders.some(h =>
    ['personnummer', 'anställd', 'medarbetare'].includes(h)
  );
  const hasClientFields = normalizedHeaders.some(h =>
    ['organisationsnummer', 'orgnr', 'kontaktperson'].includes(h)
  );
  const hasInvoiceFields = normalizedHeaders.some(h =>
    ['fakturanummer', 'förfallodatum'].includes(h)
  );

  if (hasInvoiceFields) return 'invoices';
  if (hasTimeEntryFields) return 'time_entries';
  if (hasEmployeeFields) return 'employees';
  if (hasClientFields) return 'clients';
  if (hasProjectFields) return 'projects';

  // Fallback: check for common field combinations
  if (normalizedHeaders.includes('kund') && normalizedHeaders.includes('projekt')) {
    return 'projects';
  }
  if (normalizedHeaders.includes('datum') && normalizedHeaders.includes('timmar')) {
    return 'time_entries';
  }
  if (normalizedHeaders.includes('email') && normalizedHeaders.includes('telefon')) {
    return normalizedHeaders.includes('organisationsnummer') ? 'clients' : 'employees';
  }

  return null;
}

// Validate imported data
export function validateImportData<T>(
  data: T[],
  dataType: ImportDataType
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.length === 0) {
    errors.push('Ingen data att importera');
    return { valid: false, errors };
  }

  switch (dataType) {
    case 'projects':
      for (let i = 0; i < data.length; i++) {
        const project = data[i] as ByggletProject;
        if (!project.name) {
          errors.push(`Projekt ${i + 1}: Namn saknas`);
        }
      }
      break;

    case 'time_entries':
      for (let i = 0; i < data.length; i++) {
        const entry = data[i] as ByggletTimeEntry;
        if (!entry.date) {
          errors.push(`Tidrapport ${i + 1}: Datum saknas`);
        }
        if (entry.hours <= 0 || entry.hours > 24) {
          errors.push(`Tidrapport ${i + 1}: Ogiltigt antal timmar (${entry.hours})`);
        }
      }
      break;

    case 'employees':
      const emails = new Set<string>();
      for (let i = 0; i < data.length; i++) {
        const emp = data[i] as ByggletEmployee;
        if (!emp.name) {
          errors.push(`Anställd ${i + 1}: Namn saknas`);
        }
        if (emp.email) {
          if (emails.has(emp.email.toLowerCase())) {
            errors.push(`Anställd ${i + 1}: Dublett e-post (${emp.email})`);
          }
          emails.add(emp.email.toLowerCase());
        }
      }
      break;

    case 'clients':
      for (let i = 0; i < data.length; i++) {
        const client = data[i] as ByggletClient;
        if (!client.name) {
          errors.push(`Kund ${i + 1}: Namn saknas`);
        }
      }
      break;

    case 'invoices':
      for (let i = 0; i < data.length; i++) {
        const invoice = data[i] as ByggletInvoice;
        if (!invoice.invoice_number) {
          errors.push(`Faktura ${i + 1}: Fakturanummer saknas`);
        }
        if (invoice.amount < 0) {
          errors.push(`Faktura ${i + 1}: Negativt belopp`);
        }
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
