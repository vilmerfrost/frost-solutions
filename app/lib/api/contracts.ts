// app/lib/api/contracts.ts
import { apiFetch } from '@/lib/http/fetcher'
import type { Contract, ContractItem, ContractFilters, ContractMeta } from '@/types/contracts'

interface ApiResponse<T> {
  success?: boolean
  data?: T
  meta?: ContractMeta
  error?: string
}

export class ContractsAPI {
  static async list(filters?: ContractFilters): Promise<{ data: Contract[]; meta: ContractMeta }> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.contract_type) params.set('contract_type', filters.contract_type)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.limit) params.set('limit', String(filters.limit))

    const result = await apiFetch<ApiResponse<Contract[]>>(`/api/contracts?${params}`)
    return {
      data: result.data || [],
      meta: result.meta || { page: 1, limit: 20, count: 0 },
    }
  }

  static async get(id: string): Promise<Contract> {
    const result = await apiFetch<ApiResponse<Contract>>(`/api/contracts/${id}`)
    if (!result.data) throw new Error('No contract data returned')
    return result.data
  }

  static async create(data: Partial<Contract> & { items?: Partial<ContractItem>[] }): Promise<Contract> {
    const result = await apiFetch<ApiResponse<Contract>>('/api/contracts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (!result.data) throw new Error('No contract data returned')
    return result.data
  }

  static async update(id: string, data: Partial<Contract>): Promise<Contract> {
    const result = await apiFetch<ApiResponse<Contract>>(`/api/contracts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    if (!result.data) throw new Error('No contract data returned')
    return result.data
  }

  static async remove(id: string): Promise<void> {
    await apiFetch(`/api/contracts/${id}`, { method: 'DELETE' })
  }

  static async addItem(contractId: string, item: Partial<ContractItem>): Promise<ContractItem> {
    const result = await apiFetch<ApiResponse<ContractItem>>(`/api/contracts/${contractId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    })
    if (!result.data) throw new Error('No item data returned')
    return result.data
  }

  static async updateItem(contractId: string, item: Partial<ContractItem> & { id: string }): Promise<ContractItem> {
    const result = await apiFetch<ApiResponse<ContractItem>>(`/api/contracts/${contractId}/items`, {
      method: 'PUT',
      body: JSON.stringify(item),
    })
    if (!result.data) throw new Error('No item data returned')
    return result.data
  }

  static async deleteItem(contractId: string, itemId: string): Promise<void> {
    await apiFetch(`/api/contracts/${contractId}/items`, {
      method: 'DELETE',
      body: JSON.stringify({ itemId }),
    })
  }

  static async send(id: string, signatories?: Array<{ reference: string }>): Promise<{
    orderId: string
    signatories: Array<{ id: string; reference: string; signingUrl: string }>
  }> {
    const result = await apiFetch<ApiResponse<any>>(`/api/contracts/${id}/send`, {
      method: 'POST',
      body: JSON.stringify({ signatories }),
    })
    if (!result.data) throw new Error('Failed to send for signing')
    return result.data
  }

  static pdfUrl(id: string): string {
    return `/api/contracts/${id}/pdf`
  }
}
