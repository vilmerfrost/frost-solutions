// app/hooks/useSupplierInvoices.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { BASE_PATH } from '@/utils/url'
import { toast } from '@/lib/toast'
import type {
 SupplierInvoice,
 SupplierInvoiceItem,
 SupplierInvoicePayment
} from '@/types/supplierInvoices'

export interface SupplierInvoiceFilters {
 status?: string | 'all'
 projectId?: string | 'all'
 supplierId?: string | 'all'
 search?: string
 from?: string
 to?: string
 dateFrom?: string
 dateTo?: string
 page?: number
 limit?: number
}

export function useSupplierInvoices(filters?: SupplierInvoiceFilters) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['supplier-invoices', tenantId, filters],
  queryFn: async () => {
   const params = new URLSearchParams()
   Object.entries(filters || {}).forEach(([k, v]) => {
    if (v != null) params.set(k, String(v))
   })

   // API returnerar { success: true, data: [...], meta: {...} }
   return apiFetch<{ data: SupplierInvoice[]; meta?: { page: number; limit: number; count: number } }>(
    `/api/supplier-invoices?${params.toString()}`,
    { cache: 'no-store' }
   )
  },
  enabled: !!tenantId,
  refetchOnReconnect: true,
  refetchOnWindowFocus: false,
  staleTime: 1000 * 60 * 5
 })
}

export function useSupplierInvoice(id: string | null) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['supplier-invoices', id],
  queryFn: async () => {
   if (!id) throw new Error('Invoice ID is required')

   const json = await apiFetch<{ data: SupplierInvoice }>(`/api/supplier-invoices/${id}`)
   return json.data as SupplierInvoice
  },
  enabled: !!id && !!tenantId
 })
}

export function useCreateSupplierInvoice() {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (payload: {
   supplier_id: string
   project_id?: string | null
   invoice_number: string
   invoice_date: string
   due_date?: string
   currency?: string
   exchange_rate?: number
   items?: Array<{
    item_type?: 'material' | 'labor' | 'transport' | 'other'
    name: string
    description?: string
    quantity: number
    unit?: string
    unit_price: number
    vat_rate?: number
    order_index?: number
   }>
   notes?: string
  }) => {
   return apiFetch('/api/supplier-invoices', {
    method: 'POST',
    body: JSON.stringify(payload)
   })
  },
  onSuccess: () => {
   toast.success('Leverantörsfaktura skapad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useUploadSupplierInvoice() {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (form: FormData) => {
   // Use fetch with BASE_PATH for FormData (apiFetch sets Content-Type: application/json)
   const res = await fetch(`${BASE_PATH}/api/supplier-invoices/upload`, {
    method: 'POST',
    body: form
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Upload misslyckades')
   }

   return res.json()
  },
  onSuccess: () => {
   toast.success('Faktura uppladdad & OCR:ad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useUpdateSupplierInvoice(id: string) {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (patch: {
   status?: SupplierInvoice['status']
   invoice_date?: string
   due_date?: string
   currency?: string
   exchange_rate?: number
   markup_override?: number
   notes?: string
  }) => {
   return apiFetch(`/api/supplier-invoices/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
   })
  },
  onSuccess: () => {
   toast.success('Uppdaterad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
   qc.invalidateQueries({ queryKey: ['supplier-invoices', id] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useRecordSupplierPayment(id: string) {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (payload: {
   amount: number
   paymentDate: string
   method?: string
   notes?: string
  }) => {
   return apiFetch(`/api/supplier-invoices/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload)
   })
  },
  onSuccess: () => {
   toast.success('Betalning registrerad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
   qc.invalidateQueries({ queryKey: ['supplier-invoices', id] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useConvertSupplierInvoice(id: string) {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async () => {
   return apiFetch<{ success: boolean; data: { customerInvoiceId: string } }>(
    `/api/supplier-invoices/${id}/to-customer-invoice`,
    { method: 'POST' }
   )
  },
  onSuccess: () => {
   toast.success('Kundfaktura skapad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useApproveSupplierInvoice() {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (invoiceId: string) => {
   return apiFetch(`/api/supplier-invoices/${invoiceId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'approved' })
   })
  },
  onSuccess: () => {
   toast.success('Faktura godkänd')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useArchiveSupplierInvoice() {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (invoiceId: string) => {
   return apiFetch(`/api/supplier-invoices/${invoiceId}`, { method: 'DELETE' })
  },
  onSuccess: () => {
   toast.success('Faktura arkiverad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useRegisterPayment(id: string) {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (payload: {
   amount: number
   paymentDate: string
   method?: string
   notes?: string
  }) => {
   return apiFetch(`/api/supplier-invoices/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(payload)
   })
  },
  onSuccess: () => {
   toast.success('Betalning registrerad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
   qc.invalidateQueries({ queryKey: ['supplier-invoices', id] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useConvertToCustomerInvoice() {
 const qc = useQueryClient()

 return useMutation({
  mutationFn: async (invoiceId: string) => {
   return apiFetch<{ success: boolean; data: { customerInvoiceId: string } }>(
    `/api/supplier-invoices/${invoiceId}/to-customer-invoice`,
    { method: 'POST' }
   )
  },
  onSuccess: () => {
   toast.success('Kundfaktura skapad')
   qc.invalidateQueries({ queryKey: ['supplier-invoices'] })
  },
  onError: (e: Error) => {
   toast.error(e.message)
  }
 })
}

export function useSupplierInvoiceHistory(id: string | null) {
 const { tenantId } = useTenant()

 return useQuery({
  queryKey: ['supplier-invoices', id, 'history'],
  queryFn: async () => {
   if (!id) throw new Error('Invoice ID is required')

   const json = await apiFetch<{ data: unknown }>(`/api/supplier-invoices/${id}/history`)
   return json.data
  },
  enabled: !!id && !!tenantId
 })
}

