// app/types/quotes.ts

export type QuoteStatus = 
 | 'draft' 
 | 'pending_approval' 
 | 'approved' 
 | 'sent' 
 | 'viewed' 
 | 'accepted' 
 | 'rejected' 
 | 'expired' 
 | 'archived'

export interface Quote {
 id: string
 tenant_id: string
 quote_number: string
 version_number: number
 title: string
 notes?: string
 customer_id: string
 project_id?: string
 status: QuoteStatus
 valid_until?: string
 kma_enabled: boolean
 subtotal: number
 discount_amount: number // Backend field name
 tax_amount: number    // Backend field name
 total_amount: number   // Backend field name
 currency: string
 email_sent_count: number
 opened_at?: string
 created_by: string
 approved_at?: string
 created_at: string
 updated_at: string
 
 // Relations (optional, loaded with select)
 items?: QuoteItem[]
 customer?: {
  id: string
  name: string
  email?: string
 }
 project?: {
  id: string
  name: string
 }
}

export interface QuoteItem {
 id: string
 tenant_id: string
 quote_id: string
 item_type: 'material' | 'labor' | 'other'
 name: string
 description?: string
 quantity: number
 unit: string
 unit_price: number
 discount: number // Backend field name (percent)
 vat_rate: number
 order_index: number
 
 // Generated columns from backend
 line_total?: number
 discount_amount?: number
 net_price?: number
 
 created_at?: string
}

export interface QuoteTemplate {
 id: string
 tenant_id: string
 name: string
 body: QuoteItem[] // JSONB array
 is_default?: boolean
 created_at: string
 updated_at: string
}

export interface Material {
 id: string
 tenant_id: string
 name: string
 sku?: string
 category?: string
 unit: string
 price: number
 created_at: string
 updated_at: string
}

export interface QuoteApproval {
 id: string
 tenant_id: string
 quote_id: string
 approver_user_id: string
 level: number
 status: 'pending' | 'approved' | 'rejected'
 reason?: string
 changed_at?: string
 created_at?: string
}

export interface QuoteFilters {
 status?: QuoteStatus
 customer_id?: string
 search?: string
 page?: number
 limit?: number
}

export interface QuoteMeta {
 page: number
 limit: number
 count: number
 totalPages?: number
}

