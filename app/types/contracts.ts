// app/types/contracts.ts

export type ContractStatus = 'draft' | 'sent' | 'signed' | 'active' | 'completed' | 'cancelled'
export type ContractType = 'client' | 'subcontractor'
export type ContractItemType = 'material' | 'labor' | 'other'

export interface ContractSection {
  title: string
  content: string
}

export interface Contract {
  id: string
  tenant_id: string
  project_id?: string | null
  client_id?: string | null
  contract_type: ContractType
  template_id?: string | null
  contract_number: string
  title: string
  description?: string | null
  sections: ContractSection[]
  counterparty_name?: string | null
  subtotal: number
  tax_amount: number
  total_amount: number
  start_date?: string | null
  end_date?: string | null
  valid_until?: string | null
  status: ContractStatus
  signed_pdf_url?: string | null
  created_at: string
  updated_at: string
  items?: ContractItem[]
  client?: { id: string; name: string; email?: string } | null
  project?: { id: string; name: string } | null
}

export interface ContractItem {
  id: string
  contract_id: string
  item_type: ContractItemType
  description: string
  quantity: number
  unit: string
  unit_price: number
  vat_rate: number
  line_total?: number
  sort_order: number
  created_at?: string
}

export interface ContractFilters {
  status?: ContractStatus
  contract_type?: ContractType
  search?: string
  page?: number
  limit?: number
}

export interface ContractMeta {
  page: number
  limit: number
  count: number
  totalPages?: number
}
