'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from '@/lib/toast'

export default function PublicResourcePage() {
 const params = useParams()
 const token = params.token as string
 const [resource, setResource] = useState<any>(null)
 const [linkInfo, setLinkInfo] = useState<any>(null)
 const [loading, setLoading] = useState(true)
 const [password, setPassword] = useState('')
 const [needsPassword, setNeedsPassword] = useState(false)
 const [signing, setSigning] = useState(false)
 const [signerData, setSignerData] = useState({
  signer_name: '',
  signer_email: '',
 })

 useEffect(() => {
  fetchResource()
 }, [token])

 const fetchResource = async () => {
  try {
   const url = password
    ? `/api/public/${token}?password=${encodeURIComponent(password)}`
    : `/api/public/${token}`

   const response = await fetch(url)
   const data = await response.json()

   if (response.status === 401 && data.error === 'Password required') {
    setNeedsPassword(true)
    setLoading(false)
    return
   }

   if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch resource')
   }

   setResource(data.resource)
   setLinkInfo(data.link_info)
   setNeedsPassword(false)
  } catch (error: any) {
   console.error('Error fetching resource:', error)
   toast.error(error.message || 'Kunde inte hämta resurs')
  } finally {
   setLoading(false)
  }
 }

 const handlePasswordSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  fetchResource()
 }

 const handleSign = async (e: React.FormEvent) => {
  e.preventDefault()
  setSigning(true)

  try {
   const url = password
    ? `/api/public/${token}/sign?password=${encodeURIComponent(password)}`
    : `/api/public/${token}/sign`

   const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
     ...signerData,
     signature_method: 'email',
    }),
   })

   if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to sign')
   }

   const data = await response.json()
   toast.success('Dokument signerat!')
   fetchResource() // Refresh to show signature
  } catch (error: any) {
   console.error('Error signing:', error)
   toast.error(error.message || 'Kunde inte signera')
  } finally {
   setSigning(false)
  }
 }

 if (loading) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
     <p>Laddar...</p>
    </div>
   </div>
  )
 }

 if (needsPassword) {
  return (
   <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
     <h1 className="text-2xl font-bold mb-4">Lösenord krävs</h1>
     <form onSubmit={handlePasswordSubmit}>
      <div className="mb-4">
       <label className="block text-sm font-medium mb-2">Lösenord</label>
       <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full p-2 border rounded"
        required
       />
      </div>
      <button
       type="submit"
       className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
       Öppna
      </button>
     </form>
    </div>
   </div>
  )
 }

 if (!resource) {
  return (
   <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
     <h1 className="text-2xl font-bold mb-4">Resurs hittades inte</h1>
     <p className="text-gray-600">Länken kan vara ogiltig eller ha gått ut.</p>
    </div>
   </div>
  )
 }

 return (
  <div className="min-h-screen bg-gray-50 py-8">
   <div className="max-w-4xl mx-auto px-4">
    <div className="bg-white rounded-lg shadow p-6 mb-6">
     <h1 className="text-2xl font-bold mb-4">
      {linkInfo?.resource_type === 'invoice' && 'Faktura'}
      {linkInfo?.resource_type === 'ata' && 'ÄTA (Ändring/Tillägg)'}
      {linkInfo?.resource_type === 'quote' && 'Offert'}
      {linkInfo?.resource_type === 'project' && 'Projekt'}
     </h1>

     {linkInfo && (
      <div className="mb-4 text-sm text-gray-600">
       {linkInfo.max_views && (
        <p>Visningar: {linkInfo.view_count} / {linkInfo.max_views}</p>
       )}
       {linkInfo.expires_at && (
        <p>Går ut: {new Date(linkInfo.expires_at).toLocaleDateString('sv-SE')}</p>
       )}
      </div>
     )}

     {/* Display resource data */}
     <div className="mb-6">
      {linkInfo?.resource_type === 'invoice' && (
       <div>
        <p className="font-semibold">Belopp: {resource.amount?.toLocaleString('sv-SE')} kr</p>
        <p className="text-sm text-gray-600">Status: {resource.status}</p>
        {resource.description && <p className="mt-2">{resource.description}</p>}
       </div>
      )}

      {linkInfo?.resource_type === 'ata' && (
       <div>
        <p className="font-semibold">{resource.description}</p>
        {resource.cost_frame && (
         <p className="text-sm text-gray-600">
          Kostnadsram: {resource.cost_frame.toLocaleString('sv-SE')} kr
         </p>
        )}
       </div>
      )}
     </div>

     {/* Signing form */}
     {!resource.signature_id && (
      <form onSubmit={handleSign} className="border-t pt-4">
       <h2 className="text-lg font-semibold mb-4">Signera dokument</h2>
       <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Namn</label>
        <input
         type="text"
         value={signerData.signer_name}
         onChange={(e) => setSignerData({ ...signerData, signer_name: e.target.value })}
         className="w-full p-2 border rounded"
         required
        />
       </div>
       <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
         type="email"
         value={signerData.signer_email}
         onChange={(e) => setSignerData({ ...signerData, signer_email: e.target.value })}
         className="w-full p-2 border rounded"
         required
        />
       </div>
       <button
        type="submit"
        disabled={signing}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
       >
        {signing ? 'Signerar...' : 'Signera'}
       </button>
      </form>
     )}

     {resource.signature_id && (
      <div className="border-t pt-4">
       <p className="text-green-600 font-semibold">✓ Dokumentet är signerat</p>
      </div>
     )}
    </div>
   </div>
  </div>
 )
}

