'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { apiFetch } from '@/lib/http/fetcher'

interface ATA2CardProps {
 projectId: string
 tenantId: string
}

interface ATA {
 id: string
 description: string
 cost_frame: number | null
 invoice_mode: 'separate' | 'add_to_main'
 status_timeline: any[]
 photos: string[] | null
 created_at: string
}

export default function ATA2Card({ projectId, tenantId }: ATA2CardProps) {
 const router = useRouter()
 const [atas, setAtas] = useState<ATA[]>([])
 const [loading, setLoading] = useState(true)
 const [showCreateForm, setShowCreateForm] = useState(false)
 const [formData, setFormData] = useState({
  description: '',
  cost_frame: '',
  invoice_mode: 'separate' as 'separate' | 'add_to_main',
 })

 useEffect(() => {
  fetchATAs()
 }, [projectId])

 const fetchATAs = async () => {
  try {
   const data = await apiFetch<ATA[]>(`/api/rot?project_id=${projectId}`)
   setAtas(data || [])
  } catch (error: any) {
   console.error('Error fetching ÄTAs:', error)
   toast.error('Kunde inte hämta ÄTAs')
  } finally {
   setLoading(false)
  }
 }

 const handleCreate = async (e: React.FormEvent) => {
  e.preventDefault()
  try {
   await apiFetch('/api/ata/create', {
    method: 'POST',
    body: JSON.stringify({
     project_id: projectId,
     ...formData,
     cost_frame: formData.cost_frame ? parseFloat(formData.cost_frame) : null,
    }),
   })

   toast.success('ÄTA skapad')
   setShowCreateForm(false)
   setFormData({ description: '', cost_frame: '', invoice_mode: 'separate' })
   fetchATAs()
  } catch (error: any) {
   console.error('Error creating ÄTA:', error)
   toast.error(error.message || 'Kunde inte skapa ÄTA')
  }
 }

 const handleApprove = async (ataId: string) => {
  try {
   await apiFetch(`/api/ata/${ataId}/approve`, {
    method: 'POST',
    body: JSON.stringify({}),
   })

   toast.success('ÄTA godkänd')
   fetchATAs()
  } catch (error: any) {
   console.error('Error approving ÄTA:', error)
   toast.error('Kunde inte godkänna ÄTA')
  }
 }

 if (loading) {
  return <div className="p-4">Laddar ÄTAs...</div>
 }

 return (
  <div className="bg-white rounded-lg shadow p-6">
   <div className="flex justify-between items-center mb-4">
    <h2 className="text-xl font-bold">ÄTAs (Ändringar/Tillägg)</h2>
    <button
     onClick={() => setShowCreateForm(!showCreateForm)}
     className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
    >
     {showCreateForm ? 'Avbryt' : '+ Ny ÄTA'}
    </button>
   </div>

   {showCreateForm && (
    <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 rounded">
     <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Beskrivning</label>
      <textarea
       value={formData.description}
       onChange={(e) => setFormData({ ...formData, description: e.target.value })}
       className="w-full p-2 border rounded"
       required
       rows={3}
      />
     </div>
     <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Kostnadsram (kr)</label>
      <input
       type="number"
       value={formData.cost_frame}
       onChange={(e) => setFormData({ ...formData, cost_frame: e.target.value })}
       className="w-full p-2 border rounded"
       step="0.01"
      />
     </div>
     <div className="mb-4">
      <label className="block text-sm font-medium mb-1">Faktureringsläge</label>
      <select
       value={formData.invoice_mode}
       onChange={(e) => setFormData({ ...formData, invoice_mode: e.target.value as any })}
       className="w-full p-2 border rounded"
      >
       <option value="separate">Separat faktura</option>
       <option value="add_to_main">Lägg till i huvudfaktura</option>
      </select>
     </div>
     <button
      type="submit"
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
     >
      Skapa ÄTA
     </button>
    </form>
   )}

   <div className="space-y-4">
    {atas.length === 0 ? (
     <p className="text-gray-500">Inga ÄTAs ännu</p>
    ) : (
     atas.map((ata) => (
      <div key={ata.id} className="border rounded p-4">
       <div className="flex justify-between items-start mb-2">
        <div>
         <h3 className="font-semibold">{ata.description}</h3>
         {ata.cost_frame && (
          <p className="text-sm text-gray-600">
           Kostnadsram: {ata.cost_frame.toLocaleString('sv-SE')} kr
          </p>
         )}
         <p className="text-sm text-gray-500">
          Faktureringsläge: {ata.invoice_mode === 'separate' ? 'Separat' : 'Huvudfaktura'}
         </p>
        </div>
        <button
         onClick={() => handleApprove(ata.id)}
         className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
         Godkänn
        </button>
       </div>
       {ata.photos && ata.photos.length > 0 && (
        <div className="mt-2">
         <p className="text-sm text-gray-600">Bilder: {ata.photos.length}</p>
        </div>
       )}
      </div>
     ))
    )}
   </div>
  </div>
 )
}

