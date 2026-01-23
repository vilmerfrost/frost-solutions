// app/hooks/useSupplierInvoices.ts
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTenant } from '@/context/TenantContext'
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

   const res = await fetch(`/api/supplier-invoices?${params.toString()}`, {
    cache: 'no-store'
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte hämta leverantörsfakturor')
   }

   const json = await res.json()
   // API returnerar { success: true, data: [...], meta: {...} }
   return json as { data: SupplierInvoice[]; meta?: { page: number; limit: number; count: number } }
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

   const res = await fetch(`/api/supplier-invoices/${id}`)

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte hämta leverantörsfaktura')
   }

   const json = await res.json()
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
   const res = await fetch('/api/supplier-invoices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Misslyckades skapa leverantörsfaktura')
   }

   return res.json()
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
   const res = await fetch('/api/supplier-invoices/upload', {
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
   const res = await fetch(`/api/supplier-invoices/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch)
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Uppdatering misslyckades')
   }

   return res.json()
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
   const res = await fetch(`/api/supplier-invoices/${id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Betalning misslyckades')
   }

   return res.json()
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
   const res = await fetch(`/api/supplier-invoices/${id}/to-customer-invoice`, {
    method: 'POST'
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Konvertering misslyckades')
   }

   return res.json() as Promise<{ success: boolean; data: { customerInvoiceId: string } }>
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
   const res = await fetch(`/api/supplier-invoices/${invoiceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' })
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Godkännande misslyckades')
   }

   return res.json()
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
   const res = await fetch(`/api/supplier-invoices/${invoiceId}`, {
    method: 'DELETE'
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Arkivering misslyckades')
   }

   return res.json()
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
   const res = await fetch(`/api/supplier-invoices/${id}/payments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Betalning misslyckades')
   }

   return res.json()
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
   const res = await fetch(`/api/supplier-invoices/${invoiceId}/to-customer-invoice`, {
    method: 'POST'
   })

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Konvertering misslyckades')
   }

   return res.json() as Promise<{ success: boolean; data: { customerInvoiceId: string } }>
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

   const res = await fetch(`/api/supplier-invoices/${id}/history`)

   if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Kunde inte hämta historik')
   }

   const json = await res.json()
   return json.data
  },
  enabled: !!id && !!tenantId
 })
}

