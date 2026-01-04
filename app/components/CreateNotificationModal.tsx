'use client'

import { useState, useEffect } from 'react'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import { toast } from '@/lib/toast'

interface Employee {
 id: string
 full_name?: string
 name?: string
 email?: string
}

interface CreateNotificationModalProps {
 isOpen: boolean
 onClose: () => void
 onSuccess: () => void
}

export default function CreateNotificationModal({ isOpen, onClose, onSuccess }: CreateNotificationModalProps) {
 const { tenantId } = useTenant()
 const [loading, setLoading] = useState(false)
 const [employees, setEmployees] = useState<Employee[]>([])
 const [loadingEmployees, setLoadingEmployees] = useState(false)
 
 // Form state
 const [title, setTitle] = useState('')
 const [message, setMessage] = useState('')
 const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info')
 const [recipientType, setRecipientType] = useState<'all' | 'private'>('all')
 const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
 const [link, setLink] = useState('')

 useEffect(() => {
  if (isOpen && recipientType === 'private') {
   loadEmployees()
  }
 }, [isOpen, recipientType, tenantId])

 async function loadEmployees() {
  if (!tenantId) return
  
  setLoadingEmployees(true)
  try {
   const { data, error } = await supabase
    .from('employees')
    .select('id, full_name, name, email')
    .eq('tenant_id', tenantId)
    .order('full_name', { ascending: true })

   if (error) throw error
   setEmployees(data || [])
  } catch (err: any) {
   console.error('Error loading employees:', err)
   toast.error('Kunde inte ladda anställda')
  } finally {
   setLoadingEmployees(false)
  }
 }

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  
  if (!title.trim() || !message.trim()) {
   toast.error('Titel och meddelande krävs')
   return
  }

  if (recipientType === 'private' && !selectedEmployeeId) {
   toast.error('Välj en mottagare')
   return
  }

  setLoading(true)
  try {
   const payload: any = {
    title: title.trim(),
    message: message.trim(),
    type,
   }

   if (recipientType === 'private' && selectedEmployeeId) {
    payload.recipientEmployeeId = selectedEmployeeId
   }

   if (link.trim()) {
    payload.link = link.trim()
   }

   const response = await fetch('/api/notifications/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
   })

   const result = await response.json()

   if (!response.ok || result.error) {
    throw new Error(result.error || 'Kunde inte skapa notis')
   }

   toast.success(result.message || 'Notis skapad!')
   
   // Reset form
   setTitle('')
   setMessage('')
   setType('info')
   setRecipientType('all')
   setSelectedEmployeeId('')
   setLink('')
   
   onSuccess()
   onClose()
  } catch (err: any) {
   console.error('Error creating notification:', err)
   toast.error('Kunde inte skapa notis: ' + (err.message || 'Okänt fel'))
  } finally {
   setLoading(false)
  }
 }

 if (!isOpen) return null

 return (
  <>
   {/* Backdrop */}
   <div
    className="fixed inset-0 bg-black bg-opacity-50 z-40"
    onClick={onClose}
   />
   
   {/* Modal */}
   <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
     {/* Header */}
     <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
       Skapa notis
      </h2>
      <button
       onClick={onClose}
       className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
       aria-label="Stäng"
      >
       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
       </svg>
      </button>
     </div>

     {/* Form */}
     <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Recipient Type */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Mottagare
       </label>
       <div className="flex gap-4">
        <label className="flex items-center">
         <input
          type="radio"
          name="recipientType"
          value="all"
          checked={recipientType === 'all'}
          onChange={(e) => setRecipientType(e.target.value as 'all' | 'private')}
          className="mr-2"
         />
         <span className="text-sm text-gray-700 dark:text-gray-300">Alla användare</span>
        </label>
        <label className="flex items-center">
         <input
          type="radio"
          name="recipientType"
          value="private"
          checked={recipientType === 'private'}
          onChange={(e) => setRecipientType(e.target.value as 'all' | 'private')}
          className="mr-2"
         />
         <span className="text-sm text-gray-700 dark:text-gray-300">Privat</span>
        </label>
       </div>
      </div>

      {/* Employee Selector (only if private) */}
      {recipientType === 'private' && (
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Välj mottagare *
        </label>
        {loadingEmployees ? (
         <div className="text-sm text-gray-500 dark:text-gray-400">Laddar anställda...</div>
        ) : (
         <select
          value={selectedEmployeeId}
          onChange={(e) => setSelectedEmployeeId(e.target.value)}
          className="w-full px-4 py-2 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          required={recipientType === 'private'}
         >
          <option value="">Välj anställd...</option>
          {employees.map((emp) => (
           <option key={emp.id} value={emp.id}>
            {emp.full_name || emp.name || emp.email || 'Okänd'}
            {emp.email && ` (${emp.email})`}
           </option>
          ))}
         </select>
        )}
       </div>
      )}

      {/* Type */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Typ
       </label>
       <select
        value={type}
        onChange={(e) => setType(e.target.value as any)}
        className="w-full px-4 py-2 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
       >
        <option value="info">ℹ️ Info</option>
        <option value="success">✅ Framgång</option>
        <option value="warning">⚠️ Varning</option>
        <option value="error">❌ Fel</option>
       </select>
      </div>

      {/* Title */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Titel *
       </label>
       <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full px-4 py-2 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="T.ex. Viktigt meddelande"
        required
        maxLength={100}
       />
      </div>

      {/* Message */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Meddelande *
       </label>
       <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full px-4 py-2 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="Skriv ditt meddelande här..."
        rows={4}
        required
        maxLength={500}
       />
      </div>

      {/* Link (optional) */}
      <div>
       <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Länk (valfritt)
       </label>
       <input
        type="text"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="w-full px-4 py-2 rounded-[8px] border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        placeholder="/dashboard, /projects, etc."
       />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
       <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
       >
        {loading ? 'Skapar...' : 'Skapa notis'}
       </button>
       <button
        type="button"
        onClick={onClose}
        disabled={loading}
        className="px-6 py-3 rounded-[8px] border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
       >
        Avbryt
       </button>
      </div>
     </form>
    </div>
   </div>
  </>
 )
}

