'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function InvoiceDownload({
 targetId,
 fileName,
}: {
 targetId: string
 fileName: string
}) {
 const [loading, setLoading] = useState(false)
 const searchParams = useSearchParams()
 const auto = searchParams.get('auto') === '1'

 async function handleDownload() {
  try {
   setLoading(true)
   const [html2canvasMod, jsPDFMod] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
   ])
   const html2canvas = html2canvasMod.default
   const { jsPDF } = jsPDFMod

   const node = document.getElementById(targetId)
   if (!node) throw new Error('Kunde inte hitta fakturainnehållet')

   const canvas = await html2canvas(node, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
   })

   const imgData = canvas.toDataURL('image/png')
   const pdf = new jsPDF({ orientation: 'p', unit: 'px', format: 'a4' })
   const pdfW = pdf.internal.pageSize.getWidth()
   const pdfH = pdf.internal.pageSize.getHeight()

   const imgProps = pdf.getImageProperties(imgData)
   const ratio = Math.min(pdfW / imgProps.width, pdfH / imgProps.height)
   const w = imgProps.width * ratio
   const h = imgProps.height * ratio
   const x = (pdfW - w) / 2
   const y = 0

   pdf.addImage(imgData, 'PNG', x, y, w, h)
   pdf.save(fileName)
  } catch (e: any) {
   alert(e?.message ?? 'Kunde inte generera PDF')
  } finally {
   setLoading(false)
   if (auto && typeof window !== 'undefined') {
    // liten delay så nedladdningen hinner triggas
    setTimeout(() => window.history.back(), 300)
   }
  }
 }

 useEffect(() => {
  if (auto) {
   handleDownload()
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [auto])

 return (
  <button
   onClick={handleDownload}
   className="btn-primary px-4 py-2 disabled:opacity-50"
   disabled={loading}
   aria-disabled={loading}
  >
   {loading ? 'Genererar…' : 'Ladda ner PDF'}
  </button>
 )
}
