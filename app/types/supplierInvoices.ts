// app/types/supplierInvoices.ts
export type SupplierInvoiceStatus =
 | 'draft' | 'pending_approval' | 'approved' | 'booked' | 'paid' | 'archived' | 'rejected'

export interface Supplier {
 id: string
 tenant_id: string
 name: string
 org_number?: string | null
 email?: string | null
 phone?: string | null
 default_payment_terms_days: number
 currency: string
 created_at: string
 updated_at: string
}

export interface SupplierInvoice {
 id: string
 tenant_id: string
 supplier_id: string
 project_id?: string | null
 invoice_number: string
 invoice_date: string
 due_date?: string | null
 status: SupplierInvoiceStatus
 currency: string
 exchange_rate: number
 amount_subtotal: number
 amount_tax: number
 amount_total: number
 amount_paid: number
 amount_remaining: number
 markup_total: number
 ocr_confidence?: number | null
 file_path?: string | null
 notes?: string | null
 created_by?: string | null
 created_at: string
 updated_at: string
 supplier?: Supplier
 project?: { id: string; name: string }
 items?: SupplierInvoiceItem[]
 payments?: SupplierInvoicePayment[]
 history?: SupplierInvoiceHistory[]
 converted_to_customer_invoice?: boolean
 markup_percent?: number
 billable_amount?: number
}

export interface SupplierInvoiceItem {
 id: string
 tenant_id: string
 supplier_invoice_id: string
 item_type: 'material' | 'labor' | 'transport' | 'other'
 name: string
 description?: string | null
 quantity: number
 unit: string
 unit_price: number
 vat_rate: number
 order_index: number
 line_total: number
 tax_amount: number
 created_at: string
}

export interface SupplierInvoicePayment {
 id: string
 tenant_id: string
 supplier_invoice_id: string
 amount: number
 payment_date: string
 method: string
 notes?: string | null
 created_at: string
}

export interface SupplierInvoiceAllocation {
 id: string
 tenant_id: string
 supplier_invoice_id: string
 item_id?: string | null
 project_id?: string | null
 cost_center?: string | null
 amount: number
 created_at: string
}

export interface MarkupRule {
 id: string
 tenant_id: string
 active: boolean
 priority: number
 item_type?: string | null
 supplier_id?: string | null
 project_id?: string | null
 min_amount?: number | null
 max_amount?: number | null
 markup_percent?: number | null
 markup_fixed?: number | null
 created_at: string
 updated_at: string
}

export interface MarkupCalculation {
 totalMarkup: number
 breakdown: Array<{ itemId: string; markup: number }>
}

export interface OCRResult {
 text: string
 confidence?: number
 fields?: Record<string, string>
}

export interface SupplierInvoiceHistory {
 id: string
 tenant_id: string
 supplier_invoice_id: string
 action: 'created' | 'updated' | 'approved' | 'rejected' | 'paid' | 'booked' | 'archived' | 'ocr_scanned' | 'markup_applied' | 'converted'
 data?: Record<string, any> | null
 changed_by?: string | null
 created_at: string
}

