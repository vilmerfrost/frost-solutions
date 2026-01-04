export type PayrollPeriodStatus = 'open' | 'locked' | 'exported' | 'failed';
export type PayrollExportFormat = 'fortnox-paxml' | 'visma-csv';

export interface PayrollPeriod {
 id: string;
 tenant_id: string;
 start_date: string; // YYYY-MM-DD
 end_date: string;  // YYYY-MM-DD
 export_format: PayrollExportFormat | null;
 status: PayrollPeriodStatus;
 locked_at?: string | null;
 locked_by?: string | null;
 exported_at?: string | null;
 exported_by?: string | null;
 created_at?: string;
 updated_at?: string;
}

export interface PayrollValidationIssue {
 code: string;    // t.ex. EMPLOYEE_ID_MISSING
 level: 'error' | 'warning';
 message: string;
 context?: Record<string, unknown>;
}

export interface PayrollExportResult {
 exportId: string;
 filePath: string;
 signedUrl: string;
 provider: 'fortnox' | 'visma';
 format: 'paxml' | 'csv';
 warnings?: PayrollValidationIssue[];
}

export interface PayrollPeriodFilters {
 status?: PayrollPeriodStatus;
 start?: string;
 end?: string;
}

export interface CreatePayrollPeriodPayload {
 startDate: string;
 endDate: string;
 format: PayrollExportFormat;
}

