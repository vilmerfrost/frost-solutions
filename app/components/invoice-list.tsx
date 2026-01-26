'use client'

import { useEffect, useState } from 'react'
import supabase from '@/utils/supabase/supabaseClient'

type Invoice = {
  id: string
  supplier_id: string | null
  invoice_number: string | null
  invoice_date: string | null
  status: string
  created_at: string
  file_path: string | null
  supplier?: {
    name: string
  } | null
}

interface InvoiceListProps {
  tenantId: string
}

export default function InvoiceList({ tenantId }: InvoiceListProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      console.warn('InvoiceList: No tenantId provided')
      return
    }

    console.log('📄 InvoiceList: Fetching initial invoices for tenant:', tenantId)

    // Fetch initial data
    async function fetchInvoices() {
      try {
        const { data, error } = await supabase
          .from('supplier_invoices')
          .select(`
            id,
            supplier_id,
            invoice_number,
            invoice_date,
            status,
            created_at,
            file_path,
            supplier:suppliers(name)
          `)
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) {
          console.error('❌ InvoiceList: Error fetching invoices:', error)
          setLoading(false)
          return
        }

        console.log('✅ InvoiceList: Fetched', data?.length || 0, 'invoices')
        setInvoices(data || [])
        setLoading(false)
      } catch (err) {
        console.error('❌ InvoiceList: Exception fetching invoices:', err)
        setLoading(false)
      }
    }

    fetchInvoices()

    // Set up Realtime subscription
    console.log('🔴 InvoiceList: Setting up Realtime subscription...')
    
    const channel = supabase
      .channel('realtime-invoices')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'supplier_invoices',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('🔴 InvoiceList: Realtime event received:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            // Add new invoice at the beginning of the list
            const newInvoice = payload.new as Invoice
            console.log('➕ InvoiceList: Adding new invoice:', newInvoice.id)
            
            setInvoices((prev) => {
              // Check if invoice already exists (avoid duplicates)
              if (prev.some(inv => inv.id === newInvoice.id)) {
                return prev
              }
              return [newInvoice, ...prev]
            })
          } else if (payload.eventType === 'UPDATE') {
            // Update existing invoice in the list
            const updatedInvoice = payload.new as Invoice
            console.log('🔄 InvoiceList: Updating invoice:', updatedInvoice.id)
            
            setInvoices((prev) =>
              prev.map((inv) =>
                inv.id === updatedInvoice.id ? updatedInvoice : inv
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // Remove invoice from the list
            const deletedInvoice = payload.old as { id: string }
            console.log('🗑️ InvoiceList: Removing invoice:', deletedInvoice.id)
            
            setInvoices((prev) =>
              prev.filter((inv) => inv.id !== deletedInvoice.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('🔴 InvoiceList: Subscription status:', status)
      })

    // Cleanup function
    return () => {
      console.log('🔴 InvoiceList: Cleaning up Realtime subscription...')
      supabase.removeChannel(channel)
    }
  }, [tenantId])

  // Format date helper
  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('sv-SE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return '-'
    }
  }

  // Get status badge classes
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 animate-pulse'
      case 'review_needed':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  // Get supplier name or fallback
  const getSupplierName = (invoice: Invoice) => {
    if (invoice.supplier && typeof invoice.supplier === 'object' && 'name' in invoice.supplier) {
      return invoice.supplier.name
    }
    if (!invoice.supplier_id) {
      return 'Bearbetar...'
    }
    return 'Okänd leverantör'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Laddar fakturor...</span>
        </div>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Inga fakturor än.</p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-700 rounded-[8px] border border-gray-200 dark:border-gray-600 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Leverantör
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fakturanummer
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {invoices.map((invoice) => (
              <tr 
                key={invoice.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {getSupplierName(invoice)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {invoice.invoice_number || '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                  {formatDate(invoice.invoice_date || invoice.created_at)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(invoice.status)}`}>
                    {invoice.status === 'processing' && '🔄 '}
                    {invoice.status === 'review_needed' && '⚠️ '}
                    {invoice.status === 'approved' && '✅ '}
                    {invoice.status === 'rejected' && '❌ '}
                    {invoice.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
