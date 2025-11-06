'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { useAdmin } from '@/hooks/useAdmin'
import Sidebar from '@/components/Sidebar'
import { sendInvoiceEmail } from './actions'
import { toast } from '@/lib/toast'
import FileUpload from '@/components/FileUpload'
import FileList from '@/components/FileList'
import { ExportToIntegrationButton } from '@/components/integrations/ExportToIntegrationButton'

interface Invoice {
  id: string
  number?: string
  amount: number
  customer_name?: string
  desc?: string
  status?: string
  issue_date?: string
  due_date?: string
  project_id?: string
}

interface InvoiceLine {
  id?: string
  description: string
  quantity: number
  unit: string
  rate_sek: number
  amount_sek: number
}

export default function InvoicePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { tenantId } = useTenant()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const invoiceId = params?.id as string
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [clientEmail, setClientEmail] = useState<string | null>(null)
  const [lines, setLines] = useState<InvoiceLine[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null)
  const [editingLine, setEditingLine] = useState<InvoiceLine | null>(null)

  useEffect(() => {
    if (!invoiceId || !tenantId) {
      setLoading(false)
      return
    }

    async function fetchInvoice() {
      try {
        // Progressive fallback - start without problematic columns (due_date, number, customer_id)
        let { data: invData, error: invError } = await supabase
          .from('invoices')
          .select('id, amount, customer_name, desc, description, status, issue_date, project_id, client_id, tenant_id')
          .eq('id', invoiceId)
          .eq('tenant_id', tenantId)
          .single()

        // Fallback 1: If desc column doesn't exist, try without it
        if (invError && (invError.code === '42703' || invError.code === '400' || invError.message?.includes('desc'))) {
          const fallback1 = await supabase
            .from('invoices')
            .select('id, amount, customer_name, description, status, issue_date, project_id, client_id, tenant_id')
            .eq('id', invoiceId)
            .eq('tenant_id', tenantId)
            .single()
          
          if (!fallback1.error && fallback1.data) {
            invData = { ...fallback1.data, desc: fallback1.data.description || null }
            invError = null
          } else {
            invError = fallback1.error
          }
        }

        // Fallback 2: If description also fails, try without both
        if (invError && (invError.code === '42703' || invError.code === '400' || invError.message?.includes('description'))) {
          const fallback2 = await supabase
            .from('invoices')
            .select('id, amount, customer_name, status, issue_date, project_id, client_id, tenant_id')
            .eq('id', invoiceId)
            .eq('tenant_id', tenantId)
            .single()
          
          if (!fallback2.error && fallback2.data) {
            invData = fallback2.data
            invError = null
          } else {
            invError = fallback2.error
          }
        }

        // Fallback 3: If other columns don't exist, try minimal set
        if (invError && (invError.code === '42703' || invError.code === '400' || invError.message?.includes('does not exist'))) {
          const fallback3 = await supabase
            .from('invoices')
            .select('id, amount, customer_name, client_id, project_id, tenant_id')
            .eq('id', invoiceId)
            .eq('tenant_id', tenantId)
            .single()
          
          if (!fallback3.error && fallback3.data) {
            invData = fallback3.data
            invError = null
          } else {
            invError = fallback3.error
          }
        }

        // Fallback 4: Absolute minimal set
        if (invError && (invError.code === '42703' || invError.code === '400')) {
          const fallback4 = await supabase
            .from('invoices')
            .select('id, tenant_id')
            .eq('id', invoiceId)
            .eq('tenant_id', tenantId)
            .single()
          
          if (!fallback4.error && fallback4.data) {
            invData = fallback4.data
            invError = null
          } else {
            invError = fallback4.error
          }
        }

        if (invError || !invData) {
          console.error('Error fetching invoice:', invError)
          console.error('Error details:', {
            code: invError?.code,
            message: invError?.message,
            details: invError?.details,
            hint: invError?.hint
          })
          toast.error('Kunde inte hämta faktura: ' + (invError?.message || 'Okänt fel'))
          setLoading(false)
          return
        }

        // Ensure invoice has all required fields with defaults
        const invoiceData: Invoice = {
          ...invData,
          number: invData.number || undefined, // Optional field
          amount: Number(invData.amount) || 0,
        }

        setInvoice(invoiceData)

        // Hämta kundens email från client-record om client_id finns
        if (invoiceData.client_id || invoiceData.customer_id) {
          const clientId = invoiceData.client_id || invoiceData.customer_id
          const { data: clientData } = await supabase
            .from('clients')
            .select('email')
            .eq('id', clientId)
            .maybeSingle()
          
          if (clientData?.email) {
            setClientEmail(clientData.email)
          }
        }

        // Hämta fakturarader om de finns - progressive fallback för saknade kolumner
        // Try without quantity first (column might not exist)
        let { data: linesData, error: linesError } = await supabase
          .from('invoice_lines')
          .select('id, description, unit, rate_sek, amount_sek, sort_order')
          .eq('invoice_id', invoiceId)
          .order('sort_order', { ascending: true })

        // Fallback 1: Om sort_order saknas
        if (linesError && (linesError.code === '42703' || linesError.code === '400') && linesError.message?.includes('sort_order')) {
          const fallback1 = await supabase
            .from('invoice_lines')
            .select('id, description, unit, rate_sek, amount_sek')
            .eq('invoice_id', invoiceId)
          
          if (!fallback1.error) {
            linesData = (fallback1.data || []).map((line: any) => ({ ...line, quantity: 1, sort_order: 0 }))
            linesError = null
          } else {
            linesError = fallback1.error
          }
        }

        // Fallback 2: Om unit saknas
        if (linesError && (linesError.code === '42703' || linesError.code === '400') && linesError.message?.includes('unit')) {
          const fallback2 = await supabase
            .from('invoice_lines')
            .select('id, description, rate_sek, amount_sek, sort_order')
            .eq('invoice_id', invoiceId)
            .order('sort_order', { ascending: true })
          
          if (!fallback2.error) {
            linesData = (fallback2.data || []).map((line: any) => ({ ...line, unit: 'tim', quantity: 1 }))
            linesError = null
          } else {
            linesError = fallback2.error
          }
        }

        // Fallback 3: Minimal set (no quantity, no unit, no sort_order)
        if (linesError && (linesError.code === '42703' || linesError.code === '400')) {
          const fallback3 = await supabase
            .from('invoice_lines')
            .select('id, description, amount_sek')
            .eq('invoice_id', invoiceId)
          
          if (!fallback3.error) {
            linesData = (fallback3.data || []).map((line: any) => ({
              ...line,
              unit: 'tim',
              quantity: 1,
              rate_sek: line.amount_sek || 0,
              sort_order: 0,
            }))
            linesError = null
          } else {
            linesError = fallback3.error
          }
        }
        
        // Add quantity to all lines if missing
        if (linesData && !linesError) {
          linesData = linesData.map((line: any) => ({
            ...line,
            quantity: line.quantity || 1,
          }));
        }

        if (linesError) {
          const errorMessage = linesError.message || linesError.code || JSON.stringify(linesError) || 'Okänt fel';
          console.error('Error fetching invoice lines:', errorMessage, {
            code: linesError.code,
            message: linesError.message,
            details: linesError.details,
            hint: linesError.hint,
          })
          // Fortsätt ändå - låt användaren se fakturan även om lines misslyckas
        }

        if (linesData && linesData.length > 0) {
          console.log(`✅ Found ${linesData.length} invoice lines`)
          setLines(linesData as InvoiceLine[])
        } else {
          console.log('⚠️ No invoice lines found, checking if we should create from invoice data')
          // Om inga rader finns, skapa en från faktura-data
          if (invData.desc && invData.amount) {
            console.log('Creating fallback line from invoice desc/amount')
            setLines([{
              description: invData.desc,
              quantity: 1,
              unit: 'st',
              rate_sek: Number(invData.amount) || 0,
              amount_sek: Number(invData.amount) || 0,
            }])
          } else {
            console.log('No invoice lines and no fallback data available')
            setLines([])
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInvoice()
  }, [invoiceId, tenantId])

  async function handleDownloadPDF() {
    setDownloading(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}`)
      
      if (!response.ok) {
        throw new Error('Kunde inte generera PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `faktura-${invoice?.number || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      toast.error('Kunde inte ladda ner PDF: ' + (err instanceof Error ? err.message : 'Okänt fel'))
    } finally {
      setDownloading(false)
    }
  }

  async function handleApproveInvoice() {
    if (!invoice?.project_id) {
      toast.error('Denna faktura är inte kopplad till ett projekt.')
      return
    }
    
    if (!confirm('Vill du godkänna denna faktura och markera alla time entries som fakturerade? Detta går inte att ångra.')) return
    
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/approve`, {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Kunde inte godkänna faktura')
      }
      
      toast.success('Fakturan godkänd! Time entries markerade som fakturerade.')
      
      // Update invoice status
      setInvoice({ ...invoice, status: 'sent' })
      
      // Dispatch invoice updated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
          detail: { invoiceId, timestamp: Date.now() }
        }))
      }
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    }
  }

  async function handleSendEmail() {
    if (!clientEmail && !invoice?.customer_name) {
      toast.error('Kunden saknar e-postadress. Lägg till e-post i kundinformationen först.')
      return
    }
    
    if (!confirm(`Vill du skicka fakturan via e-post till ${clientEmail || invoice?.customer_name}?`)) return
    
    setSending(true)
    try {
      // Mark time entries as billed before sending (if not already done)
      if (invoice?.project_id) {
        try {
          await fetch(`/api/invoices/${invoiceId}/approve`, {
            method: 'POST',
          })
        } catch (err) {
          console.warn('Could not mark time entries as billed:', err)
          // Continue anyway - invoice can still be sent
        }
      }
      
      await sendInvoiceEmail(invoiceId)
      toast.success('Fakturan har skickats!')
      
      // Dispatch invoice updated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
          detail: { invoiceId, timestamp: Date.now() }
        }))
      }
      
      window.location.reload()
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Är du säker på att du vill ta bort denna faktura? Detta går inte att ångra.')) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/delete`, {
        method: 'DELETE',
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Kunde inte ta bort faktura')
      }
      
      toast.success('Faktura borttagen!')
      
      // Dispatch invoice deleted event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invoiceDeleted', { 
          detail: { invoiceId, timestamp: Date.now() }
        }))
      }
      
      router.push('/invoices')
    } catch (err: any) {
      toast.error('Fel: ' + (err.message || 'Okänt fel'))
    } finally {
      setDeleting(false)
    }
  }

  async function handleMarkPaid() {
    if (!confirm('Markera fakturan som betald?')) return
    
    try {
      if (!tenantId) {
        toast.error('Ingen tenant vald')
        return
      }

      const { error } = await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', invoiceId)
        .eq('tenant_id', tenantId) // Security: Ensure tenant match
      
      if (error) throw error
      toast.success('Fakturan markerad som betald!')
      
      // Update local state
      setInvoice({ ...invoice!, status: 'paid' })
      
      // Dispatch invoice updated event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
          detail: { invoiceId, timestamp: Date.now() }
        }))
      }
      
      // Refresh page after a short delay to ensure sync
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    }
  }

  function startEditLine(index: number) {
    setEditingLineIndex(index)
    setEditingLine({ ...lines[index] })
  }

  function cancelEdit() {
    setEditingLineIndex(null)
    setEditingLine(null)
  }

  async function saveLine(index: number) {
    if (!editingLine) return
    
    // Recalculate amount if quantity or rate changed
    const newAmount = Number(editingLine.quantity || 0) * Number(editingLine.rate_sek || 0)
    const updatedLine = { ...editingLine, amount_sek: newAmount }
    
    try {
      const line = lines[index]
      
      // If line has an id, update it in the database
      if (line.id) {
        if (!tenantId) {
          toast.error('Ingen tenant vald')
          return
        }

        const { error } = await supabase
          .from('invoice_lines')
          .update({
            description: updatedLine.description,
            quantity: updatedLine.quantity,
            unit: updatedLine.unit,
            rate_sek: updatedLine.rate_sek,
            amount_sek: updatedLine.amount_sek,
          })
          .eq('id', line.id)
          .eq('tenant_id', tenantId) // Security: Ensure tenant match
        
        if (error) throw error
        
        // Dispatch invoice updated event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('invoiceUpdated', { 
            detail: { invoiceId, timestamp: Date.now() }
          }))
        }
      }
      
      // Update local state
      const updatedLines = [...lines]
      updatedLines[index] = updatedLine
      setLines(updatedLines)
      
      // Recalculate total
      const newTotal = updatedLines.reduce((sum, line) => sum + Number(line.amount_sek || 0), 0)
      setInvoice({ ...invoice!, amount: newTotal })
      
      setEditingLineIndex(null)
      setEditingLine(null)
      toast.success('Rad uppdaterad!')
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    }
  }

  async function deleteLine(index: number) {
    if (!confirm('Vill du ta bort denna rad?')) return
    
    const line = lines[index]
    
    try {
      // If line has an id, delete it from the database
      if (line?.id) {
        if (!tenantId) {
          toast.error('Ingen tenant vald')
          return
        }

        const { error } = await supabase
          .from('invoice_lines')
          .delete()
          .eq('id', line.id)
          .eq('tenant_id', tenantId) // Security: Ensure tenant match
        
        if (error) throw error
      }
      
      // Update local state
      const updatedLines = lines.filter((_, i) => i !== index)
      setLines(updatedLines)
      
      toast.success('Rad borttagen!')
    } catch (err: any) {
      toast.error('Fel: ' + err.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-gray-500">Laddar...</div>
        </main>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-white flex">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-red-500">Faktura hittades inte</div>
        </main>
      </div>
    )
  }

  // Calculate total from lines first, fallback to invoice.amount
  const linesTotal = lines.reduce((sum, line) => sum + Number(line.amount_sek || 0), 0)
  const total = linesTotal > 0 ? linesTotal : Number(invoice.amount || 0)
  const rot = total * 0.3
  const toPay = total - rot

  return (
    <div className="min-h-screen bg-white flex">
      <Sidebar />
      <main className="flex-1 lg:ml-0 overflow-x-hidden">
        <div className="p-6 lg:p-10 max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">
              Invoice {invoice.number || invoiceId.slice(0, 8)}
            </h1>
            <p className="text-gray-500">Fakturainformation</p>
          </div>

          {searchParams?.get('sent') === '1' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              ✓ Fakturan har skickats via e-post!
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="p-8 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 mb-2">FAKTURA</h2>
                  <div className="text-sm text-gray-600">
                    <div>Fakturanr: <span className="font-semibold">{invoice.number || invoiceId.slice(0, 8)}</span></div>
                    {invoice.issue_date && (
                      <div>Datum: <span className="font-semibold">{new Date(invoice.issue_date).toLocaleDateString('sv-SE')}</span></div>
                    )}
                    {invoice.due_date && (
                      <div>Förfallodatum: <span className="font-semibold">{new Date(invoice.due_date).toLocaleDateString('sv-SE')}</span></div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="mb-2">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      invoice.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status || 'draft'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    Totalt: {total.toLocaleString('sv-SE')} kr
                  </div>
                </div>
              </div>
            </div>

            {/* Kund */}
            <div className="p-8 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Faktura till</h3>
              <div className="text-lg font-semibold text-gray-900">{invoice.customer_name || 'Okänd kund'}</div>
            </div>

            {/* Rader */}
            <div className="p-8">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 font-semibold text-gray-700">Beskrivning</th>
                    <th className="text-right py-4 font-semibold text-gray-700">Antal</th>
                    <th className="text-right py-4 font-semibold text-gray-700">Enhet</th>
                    <th className="text-right py-4 font-semibold text-gray-700">Á-pris</th>
                    <th className="text-right py-4 font-semibold text-gray-700">Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        <div className="mb-2">Inga fakturarader ännu</div>
                        <div className="text-sm">Totalt belopp: <span className="font-semibold">{total.toLocaleString('sv-SE')} kr</span></div>
                        {invoice.desc || invoice.description ? (
                          <div className="text-sm mt-2 text-gray-600">{invoice.desc || invoice.description}</div>
                        ) : null}
                      </td>
                    </tr>
                  ) : (
                    lines.map((line, i) => (
                      <tr key={i} className="border-b border-gray-100">
                        {editingLineIndex === i ? (
                          <>
                            <td className="py-4">
                              <input
                                type="text"
                                value={editingLine?.description || ''}
                                onChange={(e) => setEditingLine({ ...editingLine!, description: e.target.value })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="py-4">
                              <input
                                type="number"
                                step="0.01"
                                value={editingLine?.quantity || 0}
                                onChange={(e) => {
                                  const qty = Number(e.target.value)
                                  const rate = Number(editingLine?.rate_sek || 0)
                                  setEditingLine({ ...editingLine!, quantity: qty, amount_sek: qty * rate })
                                }}
                                className="w-full px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="py-4">
                              <input
                                type="text"
                                value={editingLine?.unit || ''}
                                onChange={(e) => setEditingLine({ ...editingLine!, unit: e.target.value })}
                                className="w-full px-2 py-1 border rounded"
                              />
                            </td>
                            <td className="py-4">
                              <input
                                type="number"
                                step="0.01"
                                value={editingLine?.rate_sek || 0}
                                onChange={(e) => {
                                  const rate = Number(e.target.value)
                                  const qty = Number(editingLine?.quantity || 0)
                                  setEditingLine({ ...editingLine!, rate_sek: rate, amount_sek: qty * rate })
                                }}
                                className="w-full px-2 py-1 border rounded text-right"
                              />
                            </td>
                            <td className="py-4">
                              <div className="flex gap-2 justify-end">
                                <span className="font-semibold">{Number(editingLine?.amount_sek || 0).toLocaleString('sv-SE')} kr</span>
                                <button
                                  onClick={() => saveLine(i)}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-sm"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="px-2 py-1 bg-gray-500 text-white rounded text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 text-gray-900">{line.description}</td>
                            <td className="py-4 text-right text-gray-600">{Number(line.quantity).toFixed(2)}</td>
                            <td className="py-4 text-right text-gray-600">{line.unit}</td>
                            <td className="py-4 text-right text-gray-600">{Number(line.rate_sek).toLocaleString('sv-SE')} kr</td>
                            <td className="py-4 text-right">
                              <div className="flex gap-2 justify-end items-center">
                                <span className="font-semibold text-gray-900">{Number(line.amount_sek).toLocaleString('sv-SE')} kr</span>
                                <button
                                  onClick={() => startEditLine(i)}
                                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteLine(i)}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Totals */}
              {(total > 0 || lines.length === 0) && (
                <div className="mt-8 flex justify-end">
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-gray-700">
                      <span>Summa</span>
                      <span className="font-semibold">{total.toLocaleString('sv-SE')} kr</span>
                    </div>
                    {total > 0 && (
                      <>
                        <div className="flex justify-between text-green-700">
                          <span>Preliminärt ROT-avdrag (30%)</span>
                          <span className="font-semibold">−{rot.toLocaleString('sv-SE')} kr</span>
                        </div>
                        <div className="pt-4 border-t-2 border-gray-300 flex justify-between text-xl font-black text-gray-900">
                          <span>ATT BETALA</span>
                          <span>{toPay.toLocaleString('sv-SE')} kr</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-8 bg-gray-50 border-t border-gray-200 flex flex-wrap gap-4">
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {downloading ? 'Laddar...' : '📄 Ladda ner PDF'}
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sending || invoice.status === 'paid' || !clientEmail}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                title={!clientEmail ? 'Kunden saknar e-postadress' : ''}
              >
                {sending ? 'Skickar...' : clientEmail ? '✉️ Skicka till kund' : '✉️ Skicka faktura (saknar email)'}
              </button>
              {invoice.status !== 'paid' && (
                <button
                  onClick={handleMarkPaid}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  ✓ Markera som betald
                </button>
              )}
              
              {/* AI-stöd Export-knapp */}
              {invoice && (
                <ExportToIntegrationButton
                  type="invoice"
                  resourceId={invoice.id}
                  resourceName={invoice.number || invoice.id}
                  variant="button"
                />
              )}
              
              {isAdmin && invoice?.project_id && invoice.status !== 'paid' && (
                <button
                  onClick={handleApproveInvoice}
                  disabled={false}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  title="Godkänn faktura och markera time entries som fakturerade"
                >
                  ✅ Godkänn faktura
                </button>
              )}
              {!adminLoading && (
                <>
                  <button
                    onClick={async () => {
                      // Double-check admin status before navigating
                      try {
                        const adminCheck = await fetch('/api/admin/check')
                        const adminData = await adminCheck.json()
                        
                        if (adminData.isAdmin) {
                          router.push(`/invoices/${invoiceId}/edit`)
                        } else {
                          toast.error('Endast admin kan redigera fakturor')
                        }
                      } catch (err) {
                        console.error('Error checking admin:', err)
                        // Try to navigate anyway - edit page will check again
                        router.push(`/invoices/${invoiceId}/edit`)
                      }
                    }}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    ✏️ Redigera
                  </button>
                  {isAdmin && invoice.status !== 'archived' && (
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                    >
                      {deleting ? 'Tar bort...' : '🗑️ Ta bort'}
                    </button>
                  )}
                </>
              )}
              {adminLoading && (
                <div className="text-sm text-gray-500">Kontrollerar behörighet...</div>
              )}
              <button
                onClick={() => router.back()}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
              >
                Tillbaka
              </button>
            </div>
          </div>

          {/* Files Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 mt-6 sm:mt-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6">Bilagor</h2>
            <FileUpload 
              entityType="invoice" 
              entityId={invoiceId}
              onUploadComplete={() => {
                // Trigger refresh
                window.location.reload()
              }}
            />
            <div className="mt-4">
              <FileList entityType="invoice" entityId={invoiceId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
