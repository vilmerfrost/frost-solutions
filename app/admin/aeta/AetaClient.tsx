'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'
import { BASE_PATH } from '@/utils/url'
import { 
 AlertTriangle, 
 Check, 
 X, 
 Send, 
 Clock, 
 DollarSign, 
 Calendar,
 User,
 Image as ImageIcon,
 ChevronDown,
 ChevronUp,
 ExternalLink,
 Loader2,
 FileText,
 Copy
} from 'lucide-react'

// Types for the enhanced ÄTA system
interface AetaRequest {
 id: string
 project_id: string
 title?: string
 description?: string
 change_type?: 'ADDITION' | 'MODIFICATION' | 'UNFORESEEN'
 photos?: string[]
 estimated_hours_category?: string
 estimated_material_cost?: number
 ordered_by_name?: string
 hours?: number
 status: 'pending' | 'approved' | 'rejected'
 created_at: string
 requested_by: string
 employee_id?: string
 
 // Admin fields
 linked_moment?: string
 follows_main_contract?: boolean
 custom_hourly_rate?: number
 custom_material_markup?: number
 internal_notes?: string
 admin_notes?: string
 
 // Customer approval
 customer_approval_status?: 'DRAFT' | 'SENT_FOR_APPROVAL' | 'APPROVED_VERBAL' | 'APPROVED_DIGITAL' | 'REJECTED'
 customer_approval_token?: string
 customer_approval_timestamp?: string
 customer_email?: string
 customer_phone?: string
 
 // Timeline
 impacts_timeline?: boolean
 new_completion_date?: string
 
 // Relations
 projects?: { name: string }
 employees?: { full_name: string } | null
}

interface AetaClientProps {
 tenantId: string
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
 ADDITION: { label: 'Tillägg', icon: '➕', color: 'bg-blue-100 text-blue-800' },
 MODIFICATION: { label: 'Ändring', icon: '✏️', color: 'bg-purple-100 text-purple-800' },
 UNFORESEEN: { label: 'Oförutsett', icon: '⚠️', color: 'bg-orange-100 text-orange-800' },
}

const CUSTOMER_STATUS_CONFIG: Record<string, { label: string; color: string; warning?: boolean }> = {
 DRAFT: { label: 'Internt utkast', color: 'bg-gray-100 text-gray-800' },
 SENT_FOR_APPROVAL: { label: 'Skickad till kund', color: 'bg-blue-100 text-blue-800' },
 APPROVED_VERBAL: { label: 'Godkänd (Muntligt)', color: 'bg-yellow-100 text-yellow-800', warning: true },
 APPROVED_DIGITAL: { label: 'Godkänd (Digitalt)', color: 'bg-green-100 text-green-800' },
 REJECTED: { label: 'Nekad av kund', color: 'bg-red-100 text-red-800' },
}

// SECURITY: Admin status is verified server-side before this component renders
export default function AetaClient({ tenantId }: AetaClientProps) {
 const router = useRouter()
 const [requests, setRequests] = useState<AetaRequest[]>([])
 const [loading, setLoading] = useState(true)
 const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
 const [expandedId, setExpandedId] = useState<string | null>(null)
 const [savingId, setSavingId] = useState<string | null>(null)
 
 // Edit state for expanded card
 const [editData, setEditData] = useState<Partial<AetaRequest>>({})

 useEffect(() => {
  if (tenantId) {
   loadRequests()
  }
 }, [tenantId, filter])

 async function loadRequests() {
  if (!tenantId) return

  setLoading(true)
  try {
   const statusParam = filter === 'all' ? null : filter
   
   let query = supabase
    .from('aeta_requests')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

   if (statusParam) {
    query = query.eq('status', statusParam)
   }

   const { data: simpleData, error: simpleError } = await query

   if (simpleError) {
    console.error('Error loading AETA requests:', simpleError)
    setRequests([])
    return
   }

   // Enrich with project and employee names
   if (simpleData && simpleData.length > 0) {
    const projectIds = [...new Set(simpleData.map((r: any) => r.project_id).filter(Boolean))]
    const employeeIds = [...new Set(simpleData.map((r: any) => r.employee_id).filter(Boolean))]

    let projects: any[] = []
    if (projectIds.length > 0) {
     const { data: projData } = await supabase
      .from('projects')
      .select('id, name')
      .in('id', projectIds)
     projects = projData || []
    }

    let employees: any[] = []
    if (employeeIds.length > 0) {
     const { data: empData } = await supabase
      .from('employees')
      .select('id, full_name, name')
      .in('id', employeeIds)
     employees = empData || []
    }

    const enriched = simpleData.map((req: any) => ({
     ...req,
     projects: projects.find(p => p.id === req.project_id) ? { name: projects.find(p => p.id === req.project_id)?.name } : null,
     employees: employees.find(e => e.id === req.employee_id) ? { full_name: employees.find(e => e.id === req.employee_id)?.full_name || employees.find(e => e.id === req.employee_id)?.name } : null,
    }))

    setRequests(enriched as AetaRequest[])
    return
   }

   setRequests([])
  } catch (err) {
   console.error('Unexpected error:', err)
   setRequests([])
  } finally {
   setLoading(false)
  }
 }

 // Expand a card for editing
 const handleExpand = (request: AetaRequest) => {
  if (expandedId === request.id) {
   setExpandedId(null)
   setEditData({})
  } else {
   setExpandedId(request.id)
   setEditData({
    follows_main_contract: request.follows_main_contract ?? true,
    custom_hourly_rate: request.custom_hourly_rate,
    custom_material_markup: request.custom_material_markup,
    linked_moment: request.linked_moment,
    customer_approval_status: request.customer_approval_status || 'DRAFT',
    customer_email: request.customer_email,
    customer_phone: request.customer_phone,
    impacts_timeline: request.impacts_timeline ?? false,
    new_completion_date: request.new_completion_date,
    internal_notes: request.internal_notes,
    admin_notes: request.admin_notes,
   })
  }
 }

 // Save admin changes
 const handleSave = async (id: string) => {
  setSavingId(id)
  try {
   const { error } = await (supabase.from('aeta_requests') as any)
    .update({
     ...editData,
     updated_at: new Date().toISOString(),
    })
    .eq('id', id)

   if (error) throw error
   toast.success('ÄTA uppdaterad!')
   await loadRequests()
  } catch (err: any) {
   toast.error('Kunde inte spara: ' + err.message)
  } finally {
   setSavingId(null)
  }
 }

 // Approve/Reject (internal status)
 const handleReview = async (id: string, status: 'approved' | 'rejected') => {
  setSavingId(id)
  try {
   const { data: userData } = await supabase.auth.getUser()
   const userId = userData?.user?.id

   const { error } = await (supabase.from('aeta_requests') as any)
    .update({
     status,
     admin_notes: editData.admin_notes || null,
     approved_by: status === 'approved' ? userId : null,
     reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)

   if (error) throw error

   // Create time entry if approved
   if (status === 'approved') {
    const request = requests.find(r => r.id === id)
    if (request && tenantId) {
     const hours = request.hours || 
      (request.estimated_hours_category === '2h' ? 2 : 
       request.estimated_hours_category === '4-8h' ? 6 : 
       request.estimated_hours_category === '>1dag' ? 8 : 0)
     
     if (hours > 0) {
      await (supabase.from('time_entries') as any).insert([{
       project_id: request.project_id,
       employee_id: request.employee_id || null,
       tenant_id: tenantId,
       date: new Date().toISOString().split('T')[0],
       hours_total: hours,
       ob_type: 'work',
       is_billed: false,
       amount_total: 0,
      }])
     }
    }
   }

   toast.success(status === 'approved' ? 'ÄTA godkänd!' : 'ÄTA avvisad')
   setExpandedId(null)
   setEditData({})
   await loadRequests()
  } catch (err: any) {
   toast.error('Fel: ' + err.message)
  } finally {
   setSavingId(null)
  }
 }

 // Send approval request to customer
 const handleSendToCustomer = async (id: string) => {
  if (!editData.customer_email && !editData.customer_phone) {
   toast.error('Ange kundens e-post eller telefon först')
   return
  }

  setSavingId(id)
  try {
   // Generate token if not exists
   const token = crypto.randomUUID()
   
   const { error } = await (supabase.from('aeta_requests') as any)
    .update({
     customer_approval_status: 'SENT_FOR_APPROVAL',
     customer_approval_token: token,
     customer_email: editData.customer_email,
     customer_phone: editData.customer_phone,
    })
    .eq('id', id)

   if (error) throw error

   // Build approval URL
   const approvalUrl = `${window.location.origin}${BASE_PATH}/approve/${token}`
   
   // Copy to clipboard
   await navigator.clipboard.writeText(approvalUrl)
   toast.success('Länk kopierad! Skicka den till kunden.')
   
   // Update local edit data
   setEditData(prev => ({
    ...prev,
    customer_approval_status: 'SENT_FOR_APPROVAL',
   }))
   
   await loadRequests()
  } catch (err: any) {
   toast.error('Kunde inte skicka: ' + err.message)
  } finally {
   setSavingId(null)
  }
 }

 const pendingCount = requests.filter(r => r.status === 'pending').length
 const verbalApprovalCount = requests.filter(r => r.customer_approval_status === 'APPROVED_VERBAL').length

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
       <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
        ÄTA-hantering
       </h1>
       <p className="text-sm text-gray-500 dark:text-gray-400">
        Granska, prissätt och skicka för kundgodkännande
       </p>
      </div>
      <div className="flex gap-2 flex-wrap">
       {pendingCount > 0 && (
        <span className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-full text-sm font-bold">
         {pendingCount} väntar
        </span>
       )}
       {verbalApprovalCount > 0 && (
        <span className="bg-orange-400 text-orange-900 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1">
         <AlertTriangle className="w-4 h-4" />
         {verbalApprovalCount} muntligt godkända
        </span>
       )}
      </div>
     </div>

     {/* Warning banner for verbal approvals */}
     {verbalApprovalCount > 0 && (
      <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl flex items-start gap-3">
       <AlertTriangle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
       <div>
        <p className="font-semibold text-orange-800 dark:text-orange-200">
         Du har {verbalApprovalCount} ÄTA med endast muntligt godkännande
        </p>
        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
         Muntliga godkännanden är juridiskt svaga. Skicka dessa för digitalt godkännande för att säkra betalningen.
        </p>
       </div>
      </div>
     )}

     {/* Filter tabs */}
     <div className="mb-6 flex gap-2 flex-wrap">
      {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
       <button
        key={f}
        onClick={() => setFilter(f)}
        className={`px-4 py-2 rounded-lg font-semibold transition ${
         filter === f
          ? 'bg-primary-500 text-white shadow-md'
          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
       >
        {f === 'all' ? 'Alla' : f === 'pending' ? 'Väntar' : f === 'approved' ? 'Godkända' : 'Avvisade'}
       </button>
      ))}
     </div>

     {/* Request List */}
     {loading ? (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center">
       <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary-500" />
       <p className="mt-2 text-gray-500">Laddar...</p>
      </div>
     ) : requests.length === 0 ? (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center text-gray-500">
       Inga ÄTA {filter !== 'all' ? `med status "${filter}"` : ''}
      </div>
     ) : (
      <div className="space-y-4">
       {requests.map((request) => {
        const isExpanded = expandedId === request.id
        const changeTypeConfig = request.change_type ? CHANGE_TYPE_LABELS[request.change_type] : null
        const customerStatusConfig = request.customer_approval_status ? CUSTOMER_STATUS_CONFIG[request.customer_approval_status] : CUSTOMER_STATUS_CONFIG.DRAFT
        
        return (
         <div
          key={request.id}
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden transition-all ${
           request.status === 'pending'
            ? 'border-l-4 border-l-yellow-400 border-gray-200 dark:border-gray-700'
            : request.status === 'approved'
            ? 'border-l-4 border-l-green-500 border-gray-200 dark:border-gray-700'
            : 'border-l-4 border-l-red-500 border-gray-200 dark:border-gray-700'
          }`}
         >
          {/* Card Header - Always visible */}
          <div 
           className="p-4 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
           onClick={() => handleExpand(request)}
          >
           <div className="flex justify-between items-start">
            <div className="flex-1">
             <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
               {request.title || request.description?.substring(0, 50) || 'Utan titel'}
              </h3>
              {changeTypeConfig && (
               <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${changeTypeConfig.color}`}>
                {changeTypeConfig.icon} {changeTypeConfig.label}
               </span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${customerStatusConfig.color}`}>
               {customerStatusConfig.label}
               {customerStatusConfig.warning && ' ⚠️'}
              </span>
             </div>
             
             <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-medium">{request.projects?.name || 'Okänt projekt'}</span>
              {request.employees && ` • ${request.employees.full_name}`}
              {request.ordered_by_name && ` • Beställd av: ${request.ordered_by_name}`}
             </p>
             
             <div className="flex items-center gap-4 text-sm text-gray-500">
              {request.estimated_hours_category && (
               <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {request.estimated_hours_category === '2h' ? '~2 tim' : 
                 request.estimated_hours_category === '4-8h' ? '4-8 tim' : '>1 dag'}
               </span>
              )}
              {request.estimated_material_cost && (
               <span className="flex items-center gap-1">
                <DollarSign className="w-4 h-4" />
                {request.estimated_material_cost >= 5000 ? '>5000 kr' : '~1000 kr'}
               </span>
              )}
              {request.photos && request.photos.length > 0 && (
               <span className="flex items-center gap-1">
                <ImageIcon className="w-4 h-4" />
                {request.photos.length} foto
               </span>
              )}
              <span className="text-gray-400">
               {new Date(request.created_at).toLocaleDateString('sv-SE')}
              </span>
             </div>
            </div>
            
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
             {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
           </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
           <div className="border-t border-gray-200 dark:border-gray-700 p-4 sm:p-6 bg-gray-50 dark:bg-gray-900/50">
            {/* Photos */}
            {request.photos && request.photos.length > 0 && (
             <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Foton</h4>
              <div className="flex flex-wrap gap-2">
               {request.photos.map((photo, i) => (
                <a 
                 key={i} 
                 href={photo} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="w-24 h-24 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                 <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </a>
               ))}
              </div>
             </div>
            )}

            {/* Description */}
            {request.description && (
             <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Beskrivning</h4>
              <p className="text-gray-600 dark:text-gray-400">{request.description}</p>
             </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Pricing Section */}
             <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
               <DollarSign className="w-4 h-4" />
               Prissättning
              </h4>
              
              <label className="flex items-center gap-3 cursor-pointer">
               <input
                type="checkbox"
                checked={editData.follows_main_contract ?? true}
                onChange={(e) => setEditData(prev => ({ ...prev, follows_main_contract: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
               />
               <span className="text-gray-700 dark:text-gray-300">Följer huvudavtal</span>
              </label>

              {!editData.follows_main_contract && (
               <div className="grid grid-cols-2 gap-4 pl-8">
                <div>
                 <label className="block text-xs text-gray-500 mb-1">Timpris (SEK)</label>
                 <input
                  type="number"
                  value={editData.custom_hourly_rate || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, custom_hourly_rate: Number(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  placeholder="500"
                 />
                </div>
                <div>
                 <label className="block text-xs text-gray-500 mb-1">Materialpåslag (%)</label>
                 <input
                  type="number"
                  value={editData.custom_material_markup || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, custom_material_markup: Number(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  placeholder="15"
                 />
                </div>
               </div>
              )}

              <div>
               <label className="block text-xs text-gray-500 mb-1">Kopplad till moment (för faktura)</label>
               <input
                type="text"
                value={editData.linked_moment || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, linked_moment: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                placeholder="T.ex. Badrum, Kök"
               />
              </div>
             </div>

             {/* Customer Approval Section */}
             <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
               <User className="w-4 h-4" />
               Kundgodkännande
              </h4>

              <div>
               <label className="block text-xs text-gray-500 mb-1">Status</label>
               <select
                value={editData.customer_approval_status || 'DRAFT'}
                onChange={(e) => setEditData(prev => ({ ...prev, customer_approval_status: e.target.value as any }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
               >
                <option value="DRAFT">Internt utkast</option>
                <option value="SENT_FOR_APPROVAL">Skickad för godkännande</option>
                <option value="APPROVED_VERBAL">Godkänd (Muntligt) ⚠️</option>
                <option value="APPROVED_DIGITAL">Godkänd (Digitalt) ✅</option>
                <option value="REJECTED">Nekad</option>
               </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs text-gray-500 mb-1">Kund e-post</label>
                <input
                 type="email"
                 value={editData.customer_email || ''}
                 onChange={(e) => setEditData(prev => ({ ...prev, customer_email: e.target.value }))}
                 className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                 placeholder="kund@exempel.se"
                />
               </div>
               <div>
                <label className="block text-xs text-gray-500 mb-1">Kund telefon</label>
                <input
                 type="tel"
                 value={editData.customer_phone || ''}
                 onChange={(e) => setEditData(prev => ({ ...prev, customer_phone: e.target.value }))}
                 className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                 placeholder="070-123 45 67"
                />
               </div>
              </div>

              <button
               onClick={() => handleSendToCustomer(request.id)}
               disabled={savingId === request.id}
               className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
               <Send className="w-4 h-4" />
               Skicka godkännande-länk till kund
              </button>

              {request.customer_approval_token && (
               <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">Godkännande-länk:</p>
                <div className="flex items-center gap-2">
                 <code className="flex-1 text-xs truncate">
                  {`${window.location.origin}${BASE_PATH}/approve/${request.customer_approval_token}`}
                 </code>
                 <button
                  onClick={async () => {
                   await navigator.clipboard.writeText(`${window.location.origin}${BASE_PATH}/approve/${request.customer_approval_token}`)
                   toast.success('Kopierad!')
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                 >
                  <Copy className="w-4 h-4" />
                 </button>
                </div>
               </div>
              )}
             </div>
            </div>

            {/* Timeline Impact */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
             <div className="flex items-start gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
               <input
                type="checkbox"
                checked={editData.impacts_timeline ?? false}
                onChange={(e) => setEditData(prev => ({ ...prev, impacts_timeline: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
               />
               <span className="text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Påverkar slutdatum
               </span>
              </label>

              {editData.impacts_timeline && (
               <div>
                <label className="block text-xs text-gray-500 mb-1">Nytt slutdatum</label>
                <input
                 type="date"
                 value={editData.new_completion_date || ''}
                 onChange={(e) => setEditData(prev => ({ ...prev, new_completion_date: e.target.value }))}
                 className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
               </div>
              )}
             </div>
            </div>

            {/* Internal Notes */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
             <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="inline w-4 h-4 mr-1" />
              Intern notering (syns ej för kund)
             </label>
             <textarea
              value={editData.internal_notes || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, internal_notes: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 resize-none"
              rows={3}
              placeholder="Anteckningar för kontoret..."
             />
            </div>

            {/* Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3">
             <button
              onClick={() => handleSave(request.id)}
              disabled={savingId === request.id}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
             >
              {savingId === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Spara ändringar
             </button>

             {request.status === 'pending' && (
              <>
               <button
                onClick={() => handleReview(request.id, 'approved')}
                disabled={savingId === request.id}
                className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
               >
                <Check className="w-4 h-4" />
                Godkänn internt
               </button>
               <button
                onClick={() => handleReview(request.id, 'rejected')}
                disabled={savingId === request.id}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
               >
                <X className="w-4 h-4" />
                Avvisa
               </button>
              </>
             )}
            </div>
           </div>
          )}
         </div>
        )
       })}
      </div>
     )}
    </div>
   </main>
  </div>
 )
}
