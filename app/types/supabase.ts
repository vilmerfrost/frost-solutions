/**
 * TypeScript types for Supabase tables
 * These types should be generated from Supabase schema, but are manually defined for now
 */

export interface Tenant {
 id: string
 name: string
 created_at?: string
 updated_at?: string
}

export interface Employee {
 id: string
 tenant_id: string
 auth_user_id: string
 full_name: string
 email: string
 role: 'admin' | 'employee'
 default_rate_sek?: number
 created_at?: string
 updated_at?: string
}

export interface Client {
 id: string
 tenant_id: string
 name: string
 email?: string
 org_number?: string
 address?: string
 phone?: string
 archived?: boolean
 created_at?: string
 updated_at?: string
}

export type PriceModel = 'hourly' | 'fixed' | 'budget'
export type ProjectStatus = 'planned' | 'active' | 'completed' | 'archived'

export interface Project {
 id: string
 tenant_id: string
 client_id?: string
 name: string
 customer_name?: string
 customer_orgnr?: string
 base_rate_sek?: number
 budgeted_hours?: number
 budget?: number
 hourly_rate?: number
 budget_hours?: number
 status?: ProjectStatus
 // New fields
 price_model?: PriceModel
 markup_percent?: number
 site_address?: string
 description?: string
 project_manager_id?: string
 // ROT/RUT fields
 is_rot_rut?: boolean
 property_designation?: string
 apartment_number?: string
 brf_org_number?: string
 // Dates
 start_date?: string
 end_date?: string
 is_active?: boolean
 created_at?: string
 updated_at?: string
}

export interface TimeEntry {
 id: string
 tenant_id: string
 employee_id: string
 project_id?: string
 date: string
 start_time?: string
 end_time?: string
 hours_total: number
 ob_type?: string
 amount_total?: number
 is_billed: boolean
 break_minutes?: number
 start_location_lat?: number
 start_location_lng?: number
 work_site_id?: string
 created_at?: string
 updated_at?: string
}

export interface Invoice {
 id: string
 tenant_id: string
 project_id?: string
 client_id?: string
 customer_id?: string
 customer_name?: string
 amount: number
 desc?: string
 description?: string
 status?: string
 number?: string
 issue_date?: string
 due_date?: string
 created_at?: string
 updated_at?: string
}

export interface InvoiceLine {
 id: string
 invoice_id: string
 tenant_id: string
 sort_order: number
 description: string
 quantity: number
 unit: string
 rate_sek: number
 amount_sek: number
 created_at?: string
}

export interface WorkSite {
 id: string
 tenant_id: string
 name: string
 address?: string
 latitude?: number
 longitude?: number
 radius_meters?: number
 auto_checkin?: boolean
 created_at?: string
 updated_at?: string
}

