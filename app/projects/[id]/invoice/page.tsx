import { createClient } from '@/utils/supabase/server'
import InvoiceDownload from '@/projects/[id]/invoice/InvoiceDownload' // återanvänd knappen

function sek(n: number) {
 try { return Number(n ?? 0).toLocaleString('sv-SE',{style:'currency',currency:'SEK'}) } catch { return `${Math.round(Number(n??0))} kr` }
}
function fmtDate(d: string | Date) {
 const dt = typeof d === 'string' ? new Date(d) : d
 return dt.toLocaleDateString('sv-SE',{year:'numeric',month:'2-digit',day:'2-digit'})
}

export default async function LockedInvoicePage({ params }: { params: { id: string } }) {
 const supabase = createClient()

 const { data: { user } } = await supabase.auth.getUser()
 if (!user) {
  return <div className="mx-auto max-w-xl p-8">Du är inte inloggad. <a className="underline" href="/login">Logga in</a></div>
 }

 const { data: invoice, error: invErr } = await supabase
  .from('invoices')
  .select('*')
  .eq('id', params.id)
  .single()

 if (invErr || !invoice) {
  return <div className="mx-auto max-w-xl p-8">Kunde inte hämta faktura.</div>
 }

 const { data: lines, error: lineErr } = await supabase
  .from('invoice_lines')
  .select('description, quantity, unit, rate_sek, amount_sek')
  .eq('invoice_id', invoice.id)
  .order('sort_order', { ascending: true })

 if (lineErr) {
  return <div className="mx-auto max-w-xl p-8">Kunde inte hämta fakturarader.</div>
 }

 const rows = lines ?? []
 const totalHours = rows.reduce((s, r:any) => s + Number(r.quantity ?? 0), 0)
 const subtotal = Number(invoice.subtotal_sek ?? 0)
 const rot = Number(invoice.rot_amount_sek ?? 0)
 const total = Number(invoice.total_due_sek ?? 0)

 return (
  <div className="mx-auto max-w-4xl p-6 space-y-6">
   <div className="flex items-center justify-between">
    <h1 className="text-2xl sm:text-3xl font-bold">Faktura {invoice.number}</h1>
    <div className="flex gap-2">
     <a href="/projects" className="btn-secondary px-4 py-2">Projekt</a>
     <InvoiceDownload targetId="pdf-invoice" fileName={`faktura-${invoice.number}.pdf`} />
    </div>
   </div>

   <div id="pdf-invoice" className="bg-white shadow-sm ring-1 ring-gray-200 rounded-[8px] overflow-hidden">
    {/* Header */}
    <div className="p-6 sm:p-8 border-b flex items-start justify-between gap-6">
     <div>
      <div className="text-3xl font-extrabold text-blue-700">Frost Solutions</div>
      <div className="text-gray-500 mt-1 text-sm">
       Org.nr: 556677-8899<br/>Gatuadress 1, 123 45 Stad<br/>info@frostbygg.se
      </div>
     </div>
     <div className="text-right">
      <div className="text-3xl font-bold">FAKTURA</div>
      <div className="text-sm text-gray-600 mt-1">
       Fakturanr: <span className="font-medium text-gray-900">{invoice.number}</span><br/>
       Datum: <span className="font-medium text-gray-900">{fmtDate(invoice.issue_date)}</span><br/>
       Förfallodatum: <span className="font-medium text-gray-900">{fmtDate(invoice.due_date)}</span><br/>
       Status: <span className="font-medium uppercase">{invoice.status}</span>
      </div>
     </div>
    </div>

    {/* Kund */}
    <div className="p-6 sm:p-8 border-b grid grid-cols-1 sm:grid-cols-2 gap-8">
     <div>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Faktura till</div>
      <div className="text-lg font-medium mt-1">{invoice.customer_name || 'Ej angiven kund'}</div>
      {invoice.customer_orgnr && <div className="text-sm text-gray-600">Org.nr: {invoice.customer_orgnr}</div>}
      {invoice.customer_email && <div className="text-sm text-gray-600">{invoice.customer_email}</div>}
      {invoice.customer_address && <div className="text-sm text-gray-600">{invoice.customer_address}</div>}
     </div>
     <div className="sm:text-right">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Betalning</div>
      <div className="text-sm text-gray-700 mt-1">Betalningsvillkor: 30 dagar netto</div>
      <div className="text-sm text-gray-700">Bankgiro: 123-4567</div>
     </div>
    </div>

    {/* Rader */}
    <div className="p-6 sm:p-8">
     <table className="w-full text-sm">
      <thead>
       <tr className="bg-gray-50 text-gray-700">
        <th className="text-left font-semibold p-3 rounded-l-lg">Beskrivning</th>
        <th className="text-right font-semibold p-3">Antal</th>
        <th className="text-right font-semibold p-3">Enhet</th>
        <th className="text-right font-semibold p-3">Á-pris</th>
        <th className="text-right font-semibold p-3 rounded-r-lg">Summa</th>
       </tr>
      </thead>
      <tbody className="divide-y">
       {rows.length === 0 && (
        <tr><td className="p-3 text-gray-500 italic" colSpan={5}>Inga rader.</td></tr>
       )}
       {rows.map((r:any, i:number) => (
        <tr key={i} className="hover:bg-gray-50">
         <td className="p-3">{r.description}</td>
         <td className="p-3 text-right">{Number(r.quantity).toFixed(2)}</td>
         <td className="p-3 text-right">{r.unit}</td>
         <td className="p-3 text-right">{sek(r.rate_sek)}</td>
         <td className="p-3 text-right font-medium">{sek(r.amount_sek)}</td>
        </tr>
       ))}
      </tbody>
     </table>

     {/* Summering */}
     <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-8">
      <div className="text-sm text-gray-600">Totalt antal timmar: <span className="font-medium">{totalHours.toFixed(2)} tim</span></div>
      <div className="space-y-2 text-sm">
       <div className="flex justify-between">
        <span className="text-gray-600">Summa arbetskostnad</span>
        <span className="font-semibold">{sek(subtotal)}</span>
       </div>
       <div className="flex justify-between">
        <span className="text-gray-600">Preliminärt ROT-avdrag (30%)</span>
        <span className="font-semibold text-green-700">−{sek(rot)}</span>
       </div>
       <div className="pt-3 border-t flex justify-between text-base">
        <span className="font-bold">ATT BETALA</span>
        <span className="font-extrabold">{sek(total)}</span>
       </div>
      </div>
     </div>
    </div>

    {/* Footer */}
    <div className="px-6 sm:px-8 py-6 border-t text-center text-xs text-gray-500">
     Frost Solutions | Godkänd för F-skatt | Momsreg.nr: SE556677889901
    </div>
   </div>
  </div>
 )
}
