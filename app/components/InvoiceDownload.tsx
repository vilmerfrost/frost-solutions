'use client'

import { useState } from 'react'
import { toast } from '@/lib/toast'

type Props = {
 targetId: string    // id på elementet som ska bli PDF (t.ex. "pdf-invoice")
 fileName: string    // filnamn (t.ex. "faktura-123.pdf")
 label?: string     // valfri knapptext
 className?: string   // valfri extra klass
}

export default function InvoiceDownload({ targetId, fileName, label = 'Ladda ner PDF', className = '' }: Props) {
 const [busy, setBusy] = useState(false)

 async function handleDownload() {
  try {
   setBusy(true)
   const el = document.getElementById(targetId)
   if (!el) {
    toast.error(`Kunde inte hitta element med id="${targetId}"`)
    return
   }

   const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
   ])

   const canvas = await html2canvas(el, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: el.scrollWidth,
    windowHeight: el.scrollHeight,
   })

   const imgData = canvas.toDataURL('image/png')
   const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' })

   const pageW = pdf.internal.pageSize.getWidth()
   const pageH = pdf.internal.pageSize.getHeight()
   const margin = 24
   const usableW = pageW - margin * 2
   const usableH = pageH - margin * 2

   const ratio = Math.min(usableW / canvas.width, usableH / canvas.height)
   const renderW = canvas.width * ratio
   const renderH = canvas.height * ratio
   const x = (pageW - renderW) / 2
   const y = margin

   pdf.addImage(imgData, 'PNG', x, y, renderW, renderH)
   pdf.save(fileName)
  } catch (err) {
   console.error(err)
    toast.error('Kunde inte generera PDF.')
  } finally {
   setBusy(false)
  }
 }

 return (
  <button
   type="button"
   onClick={handleDownload}
   disabled={busy}
   className={className || 'px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-60'}
   aria-busy={busy}
   aria-label={busy ? 'Genererar PDF...' : label}
  >
   {busy ? 'Genererar…' : label}
  </button>
 )
}
