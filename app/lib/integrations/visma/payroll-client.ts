// app/lib/integrations/visma/payroll-client.ts
import Bottleneck from 'bottleneck';
import { getValidToken } from './oauth';
import { extractErrorMessage } from '@/lib/errorUtils';
import { RetryStrategy } from '@/lib/sync/retry';

const limiter = new Bottleneck({ minTime: 200 }); // Rate limiting
const retry = new RetryStrategy({ initialDelayMs: 1000, maxAttempts: 7 });

type VismaOptions = { baseUrl?: string };
export class VismaPayrollClient {
 private integrationId: string;
 private baseUrl: string;

 constructor(integrationId: string, opts: VismaOptions = {}) {
  this.integrationId = integrationId;
  this.baseUrl = opts.baseUrl || process.env.VISMA_PAYROLL_BASE_URL || 'https://payroll.visma.net/api/v1';
 }

 private async request<T>(path: string, init: RequestInit): Promise<T> {
  return limiter.schedule(() =>
   retry.execute<T>(async () => {
    const tok = await getValidToken(this.integrationId);
    const res = await fetch(`${this.baseUrl}${path}`, {
     ...init,
     headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tok.access_token}`,
      ...(init.headers || {})
     }
    });
    if (!res.ok) {
     const text = await res.text();
     const err: any = new Error(`Visma Payroll API ${res.status}: ${text}`);
     err.status = res.status;
     throw err;
    }
    return res.json() as Promise<T>;
   })
  );
 }

 // ---- Time Entries ----
 createTimeEntry(employeeId: string, payload: any) { 
  return this.request(`/employees/${encodeURIComponent(employeeId)}/timeentries`, { 
   method: 'POST', 
   body: JSON.stringify(payload) 
  }); 
 }
 getTimeEntries(employeeId: string, params: URLSearchParams) { 
  return this.request(`/employees/${encodeURIComponent(employeeId)}/timeentries?${params.toString()}`, { 
   method: 'GET' 
  }); 
 }

 // ---- Employees ----
 getEmployees(params: URLSearchParams) { 
  return this.request(`/employees?${params.toString()}`, { method: 'GET' }); 
 }
 getEmployee(id: string) { 
  return this.request(`/employees/${encodeURIComponent(id)}`, { method: 'GET' }); 
 }
}

