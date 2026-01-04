// app/payroll/ExportCSV.tsx
'use client'

export default function ExportCSV({
 rows,
 fileName = 'payroll.csv',
}: {
 rows: Array<Record<string, any>>
 fileName?: string
}) {
 function toCSV(data: Array<Record<string, any>>) {
  if (!data || data.length === 0) return ''
  const cols = Object.keys(data[0])
  const esc = (v: any) => {
   const s = String(v ?? '')
   if (s.includes('"') || s.includes(';') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
   }
   return s
  }
  const head = cols.join(';')
  const body = data.map(r => cols.map(c => esc(r[c])).join(';')).join('\n')
  return head + '\n' + body
 }

 const handleDownload = () => {
  const csv = toCSV(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
 }

 return (
  <button
   type="button"
   onClick={handleDownload}
   className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
  >
   Exportera CSV
  </button>
 )
}
