// app/lib/api/quotes.ts
import { apiFetch } from '@/lib/http/fetcher'
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

  const result = await apiFetch<ApiResponse<Quote[]>>(`/api/quotes?${params}`)
  
  // Backend returns { success: true, data, meta }
  return {
   data: result.data || [],
   meta: result.meta || { page: 1, limit: 20, count: 0 }
  }
 }

 // Get single quote
 static async get(id: string): Promise<Quote> {
  console.log('[QuotesAPI.get] Starting request', { quoteId: id })

  if (!id) {
   const error = new Error('Quote ID is required')
   console.error('[QuotesAPI.get] ❌ Invalid params', { id })
   throw error
  }

  try {
   const url = `/api/quotes/${id}`
   console.log('[QuotesAPI.get] Fetching:', url)

   const result = await apiFetch<ApiResponse<Quote>>(url, {
    credentials: 'include',
   })

   if (!result.data) {
    const error = new Error('No quote data returned from API')
    console.error('[QuotesAPI.get] ❌ Invalid response', { 
     quoteId: id,
     result 
    })
    throw error
   }

   console.log('[QuotesAPI.get] ✅ Success', {
    quoteId: id,
    quoteNumber: result.data.quote_number,
    status: result.data.status,
    itemsCount: result.data.items?.length || 0,
   })

   return result.data
  } catch (error: any) {
   console.error('[QuotesAPI.get] ❌ Exception', {
    quoteId: id,
    error: error.message,
    errorType: error.constructor?.name,
    stack: error.stack?.split('\n')[0], // Första raden av stack trace
   })
   throw error
  }
 }

 // Create quote
 static async create(data: Partial<Quote>): Promise<Quote> {
  console.log('[QuotesAPI.create] Starting request', { data })

  const result = await apiFetch<ApiResponse<Quote>>('/api/quotes', {
   method: 'POST',
   credentials: 'include',
   body: JSON.stringify(data),
  })

  if (!result.data) throw new Error('No quote data returned')
  
  console.log('[QuotesAPI.create] ✅ Success', { 
   quoteId: result.data.id,
   quoteNumber: result.data.quote_number,
  })
  
  return result.data
 }

 // Update quote
 static async update(id: string, data: Partial<Quote>): Promise<Quote> {
  console.log('[QuotesAPI.update] Starting request', { quoteId: id, data })

  const result = await apiFetch<ApiResponse<Quote>>(`/api/quotes/${id}`, {
   method: 'PUT',
   credentials: 'include',
   body: JSON.stringify(data),
  })

  if (!result.data) throw new Error('No quote data returned')
  
  console.log('[QuotesAPI.update] ✅ Success', { 
   quoteId: id,
   quoteNumber: result.data.quote_number,
  })
  
  return result.data
 }

 // Delete quote
 static async delete(id: string): Promise<void> {
  console.log('[QuotesAPI.delete] Starting request', { quoteId: id })

  await apiFetch(`/api/quotes/${id}`, {
   method: 'DELETE',
   credentials: 'include',
  })

  console.log('[QuotesAPI.delete] ✅ Success', { quoteId: id })
 }

 // Get quote items
 static async getItems(quoteId: string): Promise<QuoteItem[]> {
  const result = await apiFetch<ApiResponse<QuoteItem[]>>(`/api/quotes/${quoteId}/items`)
  return result.data || []
 }

 // Create item
 static async createItem(quoteId: string, data: Partial<QuoteItem>): Promise<QuoteItem> {
  const result = await apiFetch<ApiResponse<QuoteItem>>(`/api/quotes/${quoteId}/items`, {
   method: 'POST',
   body: JSON.stringify(data)
  })

  if (!result.data) throw new Error('No item data returned')
  return result.data
 }

 // Update item - VIKTIGT: id i body, inte URL
 static async updateItem(quoteId: string, itemId: string, data: Partial<QuoteItem>): Promise<QuoteItem> {
  const result = await apiFetch<ApiResponse<QuoteItem>>(`/api/quotes/${quoteId}/items`, {
   method: 'PUT',
   body: JSON.stringify({ id: itemId, ...data })
  })

  if (!result.data) throw new Error('No item data returned')
  return result.data
 }

 // Delete item - VIKTIGT: id i body, inte URL
 static async deleteItem(quoteId: string, itemId: string): Promise<void> {
  await apiFetch(`/api/quotes/${quoteId}/items`, {
   method: 'DELETE',
   body: JSON.stringify({ id: itemId })
  })
 }

 // Send quote via email
 static async send(id: string, to: string): Promise<void> {
  await apiFetch(`/api/quotes/${id}/send`, {
   method: 'POST',
   body: JSON.stringify({ to })
  })
 }

 // Approve quote
 static async approve(id: string, level: number, reason?: string): Promise<void> {
  await apiFetch(`/api/quotes/${id}/approve`, {
   method: 'POST',
   body: JSON.stringify({ level, reason })
  })
 }

 // Convert to project
 static async convertToProject(id: string): Promise<string> {
  const result = await apiFetch<{ projectId?: string }>(`/api/quotes/${id}/convert`, {
   method: 'POST'
  })

  // Backend returns { success: true, projectId: string } (see convert route)
  if (result.projectId) return result.projectId
  throw new Error('No project ID returned')
 }

 // Duplicate quote
 static async duplicate(id: string): Promise<Quote> {
  const result = await apiFetch<{ data?: Quote }>(`/api/quotes/${id}/duplicate`, {
   method: 'POST'
  })

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
  try {
   const result = await apiFetch<{ data?: QuoteTemplate[] }>('/api/quote-templates')
   return result.data || []
  } catch {
   // Return empty array if endpoint doesn't exist yet
   return []
  }
 }

 static async get(id: string): Promise<QuoteTemplate> {
  const result = await apiFetch<{ data: QuoteTemplate }>(`/api/quote-templates/${id}`)
  return result.data
 }
}

// Materials API - TODO: Create backend routes
export class MaterialsAPI {
 static async list(search?: string): Promise<Material[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  
  try {
   const result = await apiFetch<{ data?: Material[] }>(`/api/materials?${params}`)
   return result.data || []
  } catch {
   // Return empty array if endpoint doesn't exist yet
   return []
  }
 }
}

