import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { pdf } from '@react-pdf/renderer'
import InvoiceDoc from '../../../lib/pdf/InvoiceDoc'
import { v4 as uuidv4 } from 'uuid'

function formatSE(dateStr?: string | null) {
 if (!dateStr) return ''
 return new Date(dateStr).toLocaleDateString('sv-SE')
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
 const { id: invoiceId } = await context.params
 try {
  if (!invoiceId) {
   return NextResponse.json({ error: 'Saknar invoice id' }, { status: 400 })
  }

  const supabase = createClient()

  // 1) Hämta fakturan - progressive fallback for missing columns
  let { data: invoice, error: invErr } = await supabase
   .from('invoices')
   .select('id, number, issue_date, due_date, tenant_id, project_id, client_id, customer_id, customer_name, desc, description, amount')
   .eq('id', invoiceId)
   .single()

  // Fallback 1: If number column doesn't exist, try without it
  if (invErr && (invErr.code === '42703' || invErr.message?.includes('number'))) {
   const fallback1 = await supabase
    .from('invoices')
    .select('id, issue_date, due_date, tenant_id, project_id, client_id, customer_id, customer_name, desc, description, amount')
    .eq('id', invoiceId)
    .single()

   if (!fallback1.error && fallback1.data) {
    invoice = { ...fallback1.data, number: fallback1.data.id.slice(0, 8) }
    invErr = null
   } else {
    invErr = fallback1.error
   }
  }

  // Fallback 2: If amount column doesn't exist, retry without it
  if (invErr && (invErr.code === '42703' || invErr.message?.includes('amount'))) {
   const fallback2 = await supabase
    .from('invoices')
    .select('id, issue_date, due_date, tenant_id, project_id, client_id, customer_id, customer_name, desc, description')
    .eq('id', invoiceId)
    .single()

   if (!fallback2.error && fallback2.data) {
    invoice = { ...fallback2.data, amount: 0, number: fallback2.data.id.slice(0, 8) } // Set default amount if column doesn't exist
    invErr = null
   } else {
    invErr = fallback2.error
   }
  }

  // Fallback 3: Minimal set
  if (invErr && (invErr.code === '42703' || invErr.code === '400')) {
   const fallback3 = await supabase
    .from('invoices')
    .select('id, tenant_id, customer_name, created_at')
    .eq('id', invoiceId)
    .single()

   if (!fallback3.error && fallback3.data) {
    invoice = { 
     ...fallback3.data, 
     amount: 0,
     number: fallback3.data.id.slice(0, 8),
     issue_date: null,
     due_date: null,
     project_id: null,
     client_id: null,
     customer_id: null,
     desc: null,
     description: null,
    }
    invErr = null
   } else {
    invErr = fallback3.error
   }
  }

  if (invErr || !invoice) {
   return NextResponse.json({ error: invErr?.message || 'Faktura saknas' }, { status: 404 })
  }

  // 2) Hämta tenant, kund, rader
  const [tenantResult, clientResult, linesResult] = await Promise.all([
   supabase.from('tenants').select('id, name, org_number, address').eq('id', invoice.tenant_id).maybeSingle(),
   invoice.client_id 
    ? supabase.from('clients').select('id, name, address, email, org_number').eq('id', invoice.client_id).maybeSingle()
    : Promise.resolve({ data: null, error: null }),
   supabase
    .from('invoice_lines')
    .select('description, quantity, unit, rate_sek, amount_sek')
    .eq('invoice_id', invoice.id),
  ])

  const tenant = tenantResult.data
  const client = clientResult.data || {
   name: invoice.customer_name || 'Okänd kund',
   address: null,
   email: null,
   org_number: null,
  }
  const lines = linesResult.data || []

  // Om inga rader finns, skapa en från faktura-data
  let finalLines = lines
  const invoiceAmount = (invoice.amount !== undefined && invoice.amount !== null) ? Number(invoice.amount) : 0
  const invoiceDesc = invoice.desc || invoice.description || ''
  
  if (lines.length === 0 && invoiceDesc && invoiceAmount > 0) {
   finalLines = [{
    description: invoiceDesc,
    quantity: 1,
    unit: 'st',
    rate_sek: invoiceAmount,
    amount_sek: invoiceAmount,
   }]
  } else if (lines.length === 0 && invoiceDesc) {
   // If no amount but has description, create a line item with 0 amount
   finalLines = [{
    description: invoiceDesc,
    quantity: 1,
    unit: 'st',
    rate_sek: 0,
    amount_sek: 0,
   }]
  }

  // 3) Rendera PDF → Stream
  const pdfStream = await pdf(
   <InvoiceDoc
    invoice={{
     number: invoice.number || invoice.id.slice(0, 8),
     issue_date: formatSE(invoice.issue_date),
     due_date: formatSE(invoice.due_date),
    }}
    tenant={{ 
     name: tenant?.name || 'Frost Solutions',
     org_number: tenant?.org_number,
     address: tenant?.address,
    }}
    client={{
     name: client.name || 'Okänd kund',
     address: client.address || '',
     email: client.email || '',
     org_number: client.org_number || null,
    }}
    lines={finalLines}
   />
  ).toBlob()

  // 4) Returnera PDF direkt som blob (för snabbare nedladdning)
  const headers = new Headers()
  headers.set('Content-Type', 'application/pdf')
  headers.set('Content-Disposition', `attachment; filename="faktura-${invoice.number || invoice.id.slice(0, 8)}.pdf"`)
  
  return new Response(pdfStream, {
   status: 200,
   headers,
  })
 } catch (e: any) {
  return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
 }
}
