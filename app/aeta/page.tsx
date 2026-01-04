'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'

interface Project {
 id: string
 name: string
}

export default function AetaPage() {
 const router = useRouter()
 const { tenantId } = useTenant()
 const [projects, setProjects] = useState<Project[]>([])
 const [selectedProject, setSelectedProject] = useState('')
 const [description, setDescription] = useState('')
 const [hours, setHours] = useState('')
 const [loading, setLoading] = useState(false)
 const [loadingProjects, setLoadingProjects] = useState(true)
 const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
 const [uploadingAttachment, setUploadingAttachment] = useState(false)

 useEffect(() => {
  async function fetchProjects() {
   if (!tenantId) {
    setLoadingProjects(false)
    return
   }

   const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name', { ascending: true })

   if (error) {
    console.error('Error fetching projects:', error)
    setProjects([])
   } else {
    setProjects(data || [])
   }
   setLoadingProjects(false)
  }

  fetchProjects()
 }, [tenantId])

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (!tenantId) {
   toast.error('Ingen tenant vald. Logga in först.')
   return
  }

  if (!selectedProject || !description || !hours) {
   toast.error('Fyll i alla obligatoriska fält.')
   return
  }

  setLoading(true)

  try {
   const { data: userData } = await supabase.auth.getUser()
   const userId = userData?.user?.id

   if (!userId) {
    toast.error('Du är inte inloggad.')
    setLoading(false)
    return
   }

   // Hämta employee_id för användaren
   const { data: employeeData } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
   
   const emp = employeeData as any

   // Upload attachment if provided
   let attachmentUrl: string | null = null
   let attachmentName: string | null = null
   
   if (attachmentFile) {
    setUploadingAttachment(true)
    try {
     const fileExt = attachmentFile.name.split('.').pop()
     const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
     const filePath = `aeta-attachments/${fileName}`

     const { data: uploadData, error: uploadError } = await supabase.storage
      .from('aeta-attachments')
      .upload(filePath, attachmentFile, {
       cacheControl: '3600',
       upsert: false
      })

     if (uploadError) {
      // If bucket doesn't exist, continue without attachment
      console.warn('Could not upload attachment:', uploadError)
     } else {
      const { data: { publicUrl } } = supabase.storage
       .from('aeta-attachments')
       .getPublicUrl(filePath)
      
      attachmentUrl = publicUrl
      attachmentName = attachmentFile.name
     }
    } catch (uploadErr) {
     console.error('Error uploading attachment:', uploadErr)
     // Continue without attachment
    } finally {
     setUploadingAttachment(false)
    }
   }

   const insertPayload: any = {
    project_id: selectedProject,
    description,
    hours: Number(hours),
    tenant_id: tenantId,
    employee_id: emp?.id || null,
    status: 'pending',
    requested_by: userId,
   }

   // Add attachment fields if available
   if (attachmentUrl) {
    insertPayload.attachment_url = attachmentUrl
   }
   if (attachmentName) {
    insertPayload.attachment_name = attachmentName
   }

   const { error } = await supabase
    .from('aeta_requests')
    .insert([insertPayload] as any)

   if (error) {
    console.error('Error saving AETA request:', error)
    toast.error('Kunde inte spara ÄTA-arbete: ' + error.message)
   } else {
    toast.success('ÄTA-förfrågan skickad! Den väntar nu på godkännande från admin.')
    // Rensa formulär
    setSelectedProject('')
    setDescription('')
    setHours('')
    setAttachmentFile(null)
    router.push('/dashboard')
   }
  } catch (err: any) {
   console.error('Unexpected error:', err)
   toast.error('Ett oväntat fel uppstod.')
  } finally {
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">ÄTA-arbete</h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Anmäl extraarbete utanför ordinarie offer/budget</p>
     </div>

     <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-[8px] text-sm text-yellow-800 dark:text-yellow-200">
      <p className="font-semibold mb-1">OBS:</p>
      <p>Din förfrågan måste godkännas av admin innan den kan faktureras.</p>
     </div>

     <form onSubmit={handleSubmit} className="bg-white rounded-[8px] shadow-md p-8 border border-gray-100 space-y-6">
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Projekt *</label>
       {loadingProjects ? (
        <div className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500">
         Laddar projekt...
        </div>
       ) : (
        <select
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
         value={selectedProject}
         onChange={(e) => setSelectedProject(e.target.value)}
         required
        >
         <option value="">Välj projekt</option>
         {projects.map((proj) => (
          <option key={proj.id} value={proj.id}>
           {proj.name}
          </option>
         ))}
        </select>
       )}
      </div>
      
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Beskrivning *</label>
       <textarea
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all hover:border-gray-300 dark:hover:border-gray-600"
        rows={4}
        placeholder="Beskriv ÄTA-arbetet, varför det behövs och vad som ska göras"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
       />
      </div>
      
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Antal timmar *</label>
       <input
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600"
        type="number"
        min={0.5}
        max={24}
        step={0.5}
        placeholder="Exempel: 4"
        value={hours}
        onChange={(e) => setHours(e.target.value)}
        required
       />
      </div>

      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Bifoga fil (valfritt)</label>
       <input
        type="file"
        onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
        className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 transition-all hover:border-gray-300 dark:hover:border-gray-600"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
       />
       {attachmentFile && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
         Vald fil: {attachmentFile.name} ({(attachmentFile.size / 1024).toFixed(1)} KB)
        </p>
       )}
       <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Tillåtna format: PDF, JPG, PNG, DOC, DOCX (max 10 MB)
       </p>
      </div>

      <div className="flex gap-4 pt-4">
       <button
        type="submit"
        disabled={loading || loadingProjects || uploadingAttachment}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
       >
        {uploadingAttachment ? 'Laddar upp bifogning...' : loading ? 'Sparar...' : 'Skicka ÄTA-förfrågan'}
       </button>
       <button
        type="button"
        onClick={() => router.back()}
        className="px-6 py-4 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
       >
        Tillbaka
       </button>
      </div>
     </form>
    </div>
   </main>
  </div>
 )
}
