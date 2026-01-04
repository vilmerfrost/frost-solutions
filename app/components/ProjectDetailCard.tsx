'use client'

import Link from 'next/link'

export default function ProjectDetailCard({ project, client, lastInv }: {
 project: any,
 client: any,
 lastInv: any
}) {
 // SEK-formatterare
 function sek(n: number) {
  try {
   return Number(n ?? 0).toLocaleString('sv-SE', { style: 'currency', currency: 'SEK' })
  } catch {
   return `${Math.round(Number(n ?? 0))} kr`
  }
 }

 return (
  <>
   {/* Actions */}
   <div className="flex flex-wrap gap-3 mt-2">
    <Link
     href={`/projects/${project.id}/invoice`}
     className="px-4 py-2 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 transition"
    >
     Visa "live" faktura
    </Link>
    {lastInv ? (
     <Link
      href={`/invoices/${lastInv.id}`}
      className="px-4 py-2 rounded-lg border border-blue-200 bg-white hover:bg-blue-50 text-blue-700 transition"
     >
      Visa senast låsta faktura{lastInv.number ? ` (${lastInv.number})` : ''}
     </Link>
    ) : null}
   </div>

   {/* Frost-info card */}
   <div className="rounded-[8px] border bg-white p-5 mt-6 shadow">
    <h2 className="font-semibold text-blue-700 mb-3">Projektinfo</h2>
    <div className="text-sm leading-6 text-blue-500">
     <div>Namn: <span className="font-medium text-blue-700">{project.name}</span></div>
     {project.status && <div>Status: <span className="font-medium">{project.status}</span></div>}
     {project.budgeted_hours != null && (
      <div>Budget timmar: <span className="font-medium">{project.budgeted_hours}</span></div>
     )}
     {project.budgeted_cost_sek != null && (
      <div>Budget kostnad: <span className="font-medium">{sek(project.budgeted_cost_sek)}</span></div>
     )}
    </div>
   </div>
  </>
 )
}
