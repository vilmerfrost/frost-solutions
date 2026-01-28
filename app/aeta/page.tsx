'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { Camera, X, AlertTriangle, Clock, Banknote, User, FileText, Loader2 } from 'lucide-react'
import { BASE_PATH } from '@/utils/url'

interface Project {
 id: string
 name: string
}

type ChangeType = 'ADDITION' | 'MODIFICATION' | 'UNFORESEEN'
type HoursCategory = '2h' | '4-8h' | '>1dag'
type MaterialCategory = '~1000kr' | '>5000kr' | 'vet_ej'

const CHANGE_TYPES: { value: ChangeType; label: string; description: string; icon: string }[] = [
 { value: 'ADDITION', label: 'Tillägg', description: 'Kunden bad om nytt jobb', icon: '➕' },
 { value: 'MODIFICATION', label: 'Ändring', description: 'Kunden ändrade sig', icon: '✏️' },
 { value: 'UNFORESEEN', label: 'Oförutsett', description: 'Vi hittade problem', icon: '⚠️' },
]

const HOURS_OPTIONS: { value: HoursCategory; label: string }[] = [
 { value: '2h', label: '~2 timmar' },
 { value: '4-8h', label: '4-8 timmar' },
 { value: '>1dag', label: 'Mer än 1 dag' },
]

const MATERIAL_OPTIONS: { value: MaterialCategory; label: string }[] = [
 { value: '~1000kr', label: '~1 000 kr' },
 { value: '>5000kr', label: '>5 000 kr' },
 { value: 'vet_ej', label: 'Vet ej' },
]

function AetaForm() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const { tenantId } = useTenant()
 const fileInputRef = useRef<HTMLInputElement>(null)
 
 // Form state
 const [projects, setProjects] = useState<Project[]>([])
 const [selectedProject, setSelectedProject] = useState('')
 const [title, setTitle] = useState('')
 const [description, setDescription] = useState('')
 const [changeType, setChangeType] = useState<ChangeType | ''>('')
 const [photos, setPhotos] = useState<File[]>([])
 const [photoUrls, setPhotoUrls] = useState<string[]>([])
 const [hoursCategory, setHoursCategory] = useState<HoursCategory | ''>('')
 const [materialCategory, setMaterialCategory] = useState<MaterialCategory | ''>('')
 const [orderedByName, setOrderedByName] = useState('')
 
 // Loading states
 const [loading, setLoading] = useState(false)
 const [loadingProjects, setLoadingProjects] = useState(true)
 const [uploadingPhotos, setUploadingPhotos] = useState(false)

 // Pre-select project from URL param
 useEffect(() => {
  const projectId = searchParams.get('projectId')
  if (projectId) {
   setSelectedProject(projectId)
  }
 }, [searchParams])

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
    .eq('status', 'active')
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

 // Handle photo selection
 const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || [])
  if (files.length === 0) return
  
  // Validate file types
  const validFiles = files.filter(f => 
   f.type.startsWith('image/') && f.size <= 10 * 1024 * 1024
  )
  
  if (validFiles.length !== files.length) {
   toast.error('Vissa filer var ogiltiga (endast bilder, max 10MB)')
  }
  
  // Create preview URLs
  const newUrls = validFiles.map(f => URL.createObjectURL(f))
  setPhotos(prev => [...prev, ...validFiles])
  setPhotoUrls(prev => [...prev, ...newUrls])
 }

 const removePhoto = (index: number) => {
  URL.revokeObjectURL(photoUrls[index])
  setPhotos(prev => prev.filter((_, i) => i !== index))
  setPhotoUrls(prev => prev.filter((_, i) => i !== index))
 }

 // Validation
 const isUnforeseenWithoutPhotos = changeType === 'UNFORESEEN' && photos.length === 0
 const canSubmit = 
  selectedProject && 
  title.trim() && 
  changeType && 
  hoursCategory &&
  !isUnforeseenWithoutPhotos

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (!tenantId) {
   toast.error('Ingen tenant vald. Logga in först.')
   return
  }

  if (!canSubmit) {
   if (isUnforeseenWithoutPhotos) {
    toast.error('Vid "Oförutsett" måste du bifoga minst ett foto som bevis.')
   } else {
    toast.error('Fyll i alla obligatoriska fält.')
   }
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

   // Get employee_id
   const { data: employeeData } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle()
   
   const emp = employeeData as any

   // Upload photos if any
   let uploadedPhotoUrls: string[] = []
   if (photos.length > 0) {
    setUploadingPhotos(true)
    try {
     for (const photo of photos) {
      const fileExt = photo.name.split('.').pop() || 'jpg'
      const fileName = `${tenantId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `ata-photos/${fileName}`

      const { error: uploadError } = await supabase.storage
       .from('ata-photos')
       .upload(filePath, photo, {
        cacheControl: '3600',
        upsert: false
       })

      if (!uploadError) {
       const { data: { publicUrl } } = supabase.storage
        .from('ata-photos')
        .getPublicUrl(filePath)
       uploadedPhotoUrls.push(publicUrl)
      } else {
       console.warn('Could not upload photo:', uploadError)
      }
     }
    } catch (uploadErr) {
     console.error('Error uploading photos:', uploadErr)
    } finally {
     setUploadingPhotos(false)
    }
   }

   // Build insert payload with new fields
   const insertPayload: any = {
    project_id: selectedProject,
    title: title.trim(),
    description: description.trim() || null,
    change_type: changeType,
    photos: uploadedPhotoUrls,
    estimated_hours_category: hoursCategory,
    estimated_material_cost: materialCategory === '~1000kr' ? 1000 : materialCategory === '>5000kr' ? 5000 : null,
    ordered_by_name: orderedByName.trim() || null,
    tenant_id: tenantId,
    employee_id: emp?.id || null,
    status: 'pending',
    requested_by: userId,
    customer_approval_status: 'DRAFT',
   }

   const { error } = await (supabase
    .from('aeta_requests') as any)
    .insert([insertPayload])

   if (error) {
    console.error('Error saving AETA request:', error)
    toast.error('Kunde inte spara ÄTA: ' + error.message)
   } else {
    toast.success('ÄTA skickad till kontoret!')
    router.push(`${BASE_PATH}/dashboard`)
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
    <div className="p-4 sm:p-6 lg:p-10 max-w-2xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
       Anmäl ÄTA
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">
       Snabbformulär - fyll i innan jobbet påbörjas
      </p>
     </div>

     <form onSubmit={handleSubmit} className="space-y-5">
      {/* Project Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        <FileText className="inline w-4 h-4 mr-1" />
        Projekt *
       </label>
       {loadingProjects ? (
        <div className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400">
         Laddar projekt...
        </div>
       ) : (
        <select
         className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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

      {/* Title - Quick description */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Vad ska göras? *
       </label>
       <input
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="T.ex. Extra regling badrum"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        maxLength={100}
       />
      </div>

      {/* Change Type - Radio buttons */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
        Typ av ÄTA *
       </label>
       <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CHANGE_TYPES.map((type) => (
         <button
          key={type.value}
          type="button"
          onClick={() => setChangeType(type.value)}
          className={`p-4 rounded-lg border-2 text-left transition-all ${
           changeType === type.value
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
         >
          <span className="text-2xl mb-2 block">{type.icon}</span>
          <span className="font-semibold text-gray-900 dark:text-white block">
           {type.label}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
           {type.description}
          </span>
         </button>
        ))}
       </div>
      </div>

      {/* Photos - Camera button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        <Camera className="inline w-4 h-4 mr-1" />
        Foton {changeType === 'UNFORESEEN' && <span className="text-red-500">* (obligatoriskt)</span>}
       </label>
       
       {/* Warning for UNFORESEEN without photos */}
       {isUnforeseenWithoutPhotos && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
         <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
         <p className="text-sm text-red-700 dark:text-red-300">
          Vid oförutsett arbete måste du ta foto på problemet innan du börjar. Det krävs för att kunna fakturera kunden.
         </p>
        </div>
       )}

       {/* Photo previews */}
       {photoUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
         {photoUrls.map((url, index) => (
          <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
           <img src={url} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
           <button
            type="button"
            onClick={() => removePhoto(index)}
            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
           >
            <X className="w-4 h-4" />
           </button>
          </div>
         ))}
        </div>
       )}

       <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handlePhotoSelect}
        className="hidden"
       />
       <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
       >
        <Camera className="w-6 h-6" />
        <span className="font-medium">Ta foto eller välj bild</span>
       </button>
      </div>

      {/* Estimates - Two dropdowns side by side */}
      <div className="grid grid-cols-2 gap-4">
       {/* Hours estimate */}
       <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         <Clock className="inline w-4 h-4 mr-1" />
         Tid *
        </label>
        <select
         className="w-full px-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         value={hoursCategory}
         onChange={(e) => setHoursCategory(e.target.value as HoursCategory)}
         required
        >
         <option value="">Välj...</option>
         {HOURS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
         ))}
        </select>
       </div>

       {/* Material estimate */}
       <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         <Banknote className="inline w-4 h-4 mr-1" />
         Material
        </label>
        <select
         className="w-full px-3 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
         value={materialCategory}
         onChange={(e) => setMaterialCategory(e.target.value as MaterialCategory)}
        >
         <option value="">Välj...</option>
         {MATERIAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
         ))}
        </select>
       </div>
      </div>

      {/* Ordered by */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        <User className="inline w-4 h-4 mr-1" />
        Beställd av (vem sa "kör"?)
       </label>
       <input
        type="text"
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        placeholder="T.ex. Kalle på plats"
        value={orderedByName}
        onChange={(e) => setOrderedByName(e.target.value)}
        maxLength={100}
       />
      </div>

      {/* Optional description */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Mer info (valfritt)
       </label>
       <textarea
        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 resize-none"
        rows={3}
        placeholder="Ytterligare detaljer..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
       />
      </div>

      {/* Submit button */}
      <div className="pt-2">
       <button
        type="submit"
        disabled={loading || !canSubmit || uploadingPhotos}
        className="w-full bg-primary-500 hover:bg-primary-600 disabled:bg-gray-400 text-white rounded-xl py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:cursor-not-allowed flex items-center justify-center gap-2"
       >
        {uploadingPhotos ? (
         <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Laddar upp foton...
         </>
        ) : loading ? (
         <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Skickar...
         </>
        ) : (
         'Skicka till kontoret'
        )}
       </button>
       
       <button
        type="button"
        onClick={() => router.back()}
        className="w-full mt-3 py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white transition-colors"
       >
        Avbryt
       </button>
      </div>
     </form>
    </div>
   </main>
  </div>
 )
}

export default function AetaPage() {
 return (
  <Suspense fallback={
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
   </div>
  }>
   <AetaForm />
  </Suspense>
 )
}
