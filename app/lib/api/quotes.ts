// app/lib/api/quotes.ts
import { extractErrorMessage } from '@/lib/errorUtils'
import type { Quote, QuoteItem, QuoteFilters, QuoteMeta, QuoteTemplate, Material } from '@/types/quotes'

interface ApiResponse<T> {
  success?: boolean
  data?: T
  meta?: QuoteMeta
  error?: string
}

export class QuotesAPI {
  // List quotes
  static async list(filters?: QuoteFilters): Promise<{ data: Quote[]; meta: QuoteMeta }> {
    const params = new URLSearchParams()
    if (filters?.status) params.set('status', filters.status)
    if (filters?.customer_id) params.set('customer_id', filters.customer_id)
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.limit) params.set('limit', String(filters.limit))

    const res = await fetch(`/api/quotes?${params}`)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to fetch quotes'))
    }

    const result: ApiResponse<Quote[]> = await res.json()
    
    // Backend returns { success: true, data, meta }
    return {
      data: result.data || [],
      meta: result.meta || { page: 1, limit: 20, count: 0 }
    }
  }

  // Get single quote
  static async get(id: string): Promise<Quote> {
    const res = await fetch(`/api/quotes/${id}`)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to fetch quote'))
    }

    const result: ApiResponse<Quote> = await res.json()
    if (!result.data) throw new Error('No quote data returned')
    return result.data
  }

  // Create quote
  static async create(data: Partial<Quote>): Promise<Quote> {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to create quote'))
    }

    const result: ApiResponse<Quote> = await res.json()
    if (!result.data) throw new Error('No quote data returned')
    return result.data
  }

  // Update quote
  static async update(id: string, data: Partial<Quote>): Promise<Quote> {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to update quote'))
    }

    const result: ApiResponse<Quote> = await res.json()
    if (!result.data) throw new Error('No quote data returned')
    return result.data
  }

  // Delete quote
  static async delete(id: string): Promise<void> {
    const res = await fetch(`/api/quotes/${id}`, {
      method: 'DELETE'
    })

    if (!res.ok && res.status !== 204) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to delete quote'))
    }
  }

  // Get quote items
  static async getItems(quoteId: string): Promise<QuoteItem[]> {
    const res = await fetch(`/api/quotes/${quoteId}/items`)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to fetch items'))
    }

    const result: ApiResponse<QuoteItem[]> = await res.json()
    return result.data || []
  }

  // Create item
  static async createItem(quoteId: string, data: Partial<QuoteItem>): Promise<QuoteItem> {
    const res = await fetch(`/api/quotes/${quoteId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to create item'))
    }

    const result: ApiResponse<QuoteItem> = await res.json()
    if (!result.data) throw new Error('No item data returned')
    return result.data
  }

  // Update item - VIKTIGT: id i body, inte URL
  static async updateItem(quoteId: string, itemId: string, data: Partial<QuoteItem>): Promise<QuoteItem> {
    const res = await fetch(`/api/quotes/${quoteId}/items`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId, ...data })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to update item'))
    }

    const result: ApiResponse<QuoteItem> = await res.json()
    if (!result.data) throw new Error('No item data returned')
    return result.data
  }

  // Delete item - VIKTIGT: id i body, inte URL
  static async deleteItem(quoteId: string, itemId: string): Promise<void> {
    const res = await fetch(`/api/quotes/${quoteId}/items`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: itemId })
    })

    if (!res.ok && res.status !== 204) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to delete item'))
    }
  }

  // Send quote via email
  static async send(id: string, to: string): Promise<void> {
    const res = await fetch(`/api/quotes/${id}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to send quote'))
    }
  }

  // Approve quote
  static async approve(id: string, level: number, reason?: string): Promise<void> {
    const res = await fetch(`/api/quotes/${id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, reason })
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to approve quote'))
    }
  }

  // Convert to project
  static async convertToProject(id: string): Promise<string> {
    const res = await fetch(`/api/quotes/${id}/convert`, {
      method: 'POST'
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to convert quote'))
    }

    const result: any = await res.json()
    // Backend returns { success: true, projectId: string } (see convert route)
    if (result.projectId) return result.projectId
    throw new Error('No project ID returned')
  }

  // Duplicate quote
  static async duplicate(id: string): Promise<Quote> {
    const res = await fetch(`/api/quotes/${id}/duplicate`, {
      method: 'POST'
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      throw new Error(extractErrorMessage(errorData.error || 'Failed to duplicate quote'))
    }

    const result: any = await res.json()
    // Backend returns { success: true, data: Quote }
    if (result.data) return result.data
    throw new Error('No quote data returned')
  }

  // Get PDF URL
  static getPDFUrl(id: string): string {
    return `/api/quotes/${id}/pdf`
  }
}

// Templates API - TODO: Create backend routes
export class TemplatesAPI {
  static async list(): Promise<QuoteTemplate[]> {
    const res = await fetch('/api/quote-templates')
    if (!res.ok) {
      // Return empty array if endpoint doesn't exist yet
      return []
    }
    const result = await res.json()
    return result.data || []
  }

  static async get(id: string): Promise<QuoteTemplate> {
    const res = await fetch(`/api/quote-templates/${id}`)
    if (!res.ok) throw new Error('Failed to fetch template')
    const result = await res.json()
    return result.data
  }
}

// Materials API - TODO: Create backend routes
export class MaterialsAPI {
  static async list(search?: string): Promise<Material[]> {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    
    const res = await fetch(`/api/materials?${params}`)
    if (!res.ok) {
      // Return empty array if endpoint doesn't exist yet
      return []
    }
    const result = await res.json()
    return result.data || []
  }
}

