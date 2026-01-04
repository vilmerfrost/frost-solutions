'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const InvoiceDownload = dynamic(() => import('@/components/InvoiceDownload'), { ssr: false })

export default function PayslipExport({
 targetId,
 fileName,
 data,
}: {
 targetId: string
 fileName: string
 data: {
  employee: { name: string; email?: string }
  label: string
  regular: number
  eve: number
  night: number
  weekend: number
  totalHours: number
  gross: number
  tax: number
  net: number
  baseRate: number
 }
}) {
 const [busyCSV, setBusyCSV] = useState(false)

 function handleExportCSV() {
  setBusyCSV(true)
  try {
   const csvRows = [
    ['Lönespecifikation', data.label],
    ['Anställd', data.employee.name],
    ['E-post', data.employee.email || ''],
    [''],
    ['Kategori', 'Timmar', 'Belopp (SEK)'],
    ['Ordinarie', data.regular.toFixed(2), (data.regular * data.baseRate * 1.0).toFixed(2)],
    ['OB Kväll (150%)', data.eve.toFixed(2), (data.eve * data.baseRate * 1.5).toFixed(2)],
    ['OB Natt (150%)', data.night.toFixed(2), (data.night * data.baseRate * 1.5).toFixed(2)],
    ['OB Helg (200%)', data.weekend.toFixed(2), (data.weekend * data.baseRate * 2.0).toFixed(2)],
    ['Totalt timmar', data.totalHours.toFixed(2), ''],
    [''],
    ['Bruttolön', '', data.gross.toFixed(2)],
    ['Skatt (30%)', '', data.tax.toFixed(2)],
    ['Netto', '', data.net.toFixed(2)],
   ]

   const csv = csvRows.map(row => row.map(cell => {
    const str = String(cell ?? '')
    if (str.includes(';') || str.includes('"') || str.includes('\n')) {
     return `"${str.replace(/"/g, '""')}"`
    }
    return str
   }).join(';')).join('\n')

   const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
   const url = URL.createObjectURL(blob)
   const a = document.createElement('a')
   a.href = url
   a.download = fileName.replace('.pdf', '.csv')
   a.click()
   URL.revokeObjectURL(url)
  } catch (err) {
   console.error('Error exporting CSV:', err)
  } finally {
   setBusyCSV(false)
  }
 }

 return (
  <div className="flex gap-2">
   <InvoiceDownload
    targetId={targetId}
    fileName={fileName}
    label="📄 Ladda ner PDF"
    className="px-4 py-2 rounded-[8px] bg-primary-500 hover:bg-primary-600 text-white font-semibold hover:shadow-md transition-all disabled:opacity-50"
   />
   <button
    type="button"
    onClick={handleExportCSV}
    disabled={busyCSV}
    className="px-4 py-2 rounded-[8px] bg-primary-500 hover:bg-primary-600 text-white font-semibold hover:shadow-md transition-all disabled:opacity-50"
   >
    {busyCSV ? 'Genererar…' : '📊 Ladda ner CSV'}
   </button>
  </div>
 )
}

