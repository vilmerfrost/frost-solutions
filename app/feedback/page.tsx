'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import FrostLogo from '@/components/FrostLogo'
import { toast } from '@/lib/toast'
import supabase from '@/utils/supabase/supabaseClient'
import AISummary from '@/components/AISummary'
import { apiFetch } from '@/lib/http/fetcher'

function FeedbackContent() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const [mounted, setMounted] = useState(false)
 
 // Pre-fill from URL params (for bug reports from errors)
 const typeParam = searchParams?.get('type') as 'bug' | 'feature' | 'other' | null
 const subjectParam = searchParams?.get('subject') || ''
 const messageParam = searchParams?.get('message') || ''
 
 // Always start with default values to avoid hydration mismatch
 const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>('bug')
 const [subject, setSubject] = useState('')
 const [message, setMessage] = useState('')
 const [email, setEmail] = useState('')
 const [loading, setLoading] = useState(false)
 
 // Prevent hydration mismatch - set mounted state on client
 useEffect(() => {
  setMounted(true)
  // Set initial values from URL params after mount
  if (typeParam) setFeedbackType(typeParam)
  if (subjectParam) setSubject(subjectParam)
  if (messageParam) setMessage(messageParam)
 }, [])
 
 // Update form when URL params change (only after mount)
 useEffect(() => {
  if (!mounted) return
  if (typeParam) setFeedbackType(typeParam)
  if (subjectParam) setSubject(subjectParam)
  if (messageParam) setMessage(messageParam)
 }, [mounted, typeParam, subjectParam, messageParam])

 async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault()
  
  if (!subject.trim() || !message.trim()) {
   toast.error('Ämne och meddelande krävs')
   return
  }

  setLoading(true)
  try {
   // Get current user info
   const { data: { user } } = await supabase.auth.getUser()
   const userEmail = email.trim() || user?.email || 'Okänd användare'
   const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Användare'

   // Send feedback via API route
   await apiFetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({
     type: feedbackType,
     subject: subject.trim(),
     message: message.trim(),
     email: userEmail,
     userName: userName,
     userAgent: navigator.userAgent,
     url: window.location.href,
    }),
   })

   toast.success('Feedback skickad! Tack för din input. 🎉')
   
   // Reset form
   setSubject('')
   setMessage('')
   setEmail('')
   setFeedbackType('bug')
  } catch (err: any) {
   console.error('Error sending feedback:', err)
   toast.error('Fel: ' + err.message)
  } finally {
   setLoading(false)
  }
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:from-gray-900 dark: dark:to-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
     {/* Header */}
     <div className="mb-8 flex flex-col items-center">
      <FrostLogo size={48} />
      <h1 className="text-4xl sm:text-5xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white dark:text-white">
       Feedback & Support
      </h1>
      {mounted && (
       <p className="text-gray-600 dark:text-gray-400 text-center">
        Rapportera buggar, föreslå funktioner eller dela din feedback
       </p>
      )}
     </div>

     {/* AI Help for Feedback */}
     {(subject || message) && (
      <div className="mb-6 sm:mb-8">
       <AISummary
        type="admin-dashboard"
        data={{
         employees: 0,
         activeProjects: 0,
         unpaidInvoices: 0,
         totalRevenue: 0,
         projects: [],
         invoices: [],
         feedback: {
          type: feedbackType,
          subject,
          message,
         },
        }}
       />
      </div>
     )}

     {/* Feedback Form */}
     <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 lg:p-10">
      <form onSubmit={handleSubmit} className="space-y-6">
       {/* Type Selection */}
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
         Typ av feedback *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
         <button
          type="button"
          onClick={() => setFeedbackType('bug')}
          className={`px-4 py-3 rounded-[8px] font-semibold transition-all ${
           feedbackType === 'bug'
            ? 'bg-red-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
         >
          🐛 Buggrapport
         </button>
         <button
          type="button"
          onClick={() => setFeedbackType('feature')}
          className={`px-4 py-3 rounded-[8px] font-semibold transition-all ${
           feedbackType === 'feature'
            ? 'bg-blue-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
         >
          💡 Funktionförslag
         </button>
         <button
          type="button"
          onClick={() => setFeedbackType('other')}
          className={`px-4 py-3 rounded-[8px] font-semibold transition-all ${
           feedbackType === 'other'
            ? 'bg-primary-500 text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
         >
          📝 Övrigt
         </button>
        </div>
       </div>

       {/* Email */}
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Din e-post
        </label>
        <input
         type="email"
         value={email}
         onChange={(e) => setEmail(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 !text-gray-900 dark:!text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
         placeholder="din@email.se"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
         Lämna tomt för att använda din inloggade e-post
        </p>
       </div>

       {/* Subject */}
       <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
         Ämne *
        </label>
        <input
         type="text"
         value={subject}
         onChange={(e) => setSubject(e.target.value)}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 !text-gray-900 dark:!text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
         placeholder={feedbackType === 'bug' ? 'Beskriv buggen kortfattat...' : 'Vad vill du dela med dig?'}
         required
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
         rows={8}
         className="w-full px-4 py-3 rounded-[8px] border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 !text-gray-900 dark:!text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
         placeholder={
          feedbackType === 'bug'
           ? 'Beskriv buggen så detaljerat som möjligt:\n\n1. Vad hände?\n2. Vad förväntade du dig?\n3. Steg för att återskapa buggen...'
           : feedbackType === 'feature'
           ? 'Beskriv din idé eller önskan så detaljerat som möjligt...'
           : 'Dela din feedback med oss...'
         }
         required
        />
       </div>

       {/* Submit Button */}
       <div className="flex gap-4">
        <button
         type="button"
         onClick={() => router.back()}
         className="flex-1 px-6 py-4 rounded-[8px] border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
        >
         Avbryt
        </button>
        <button
         type="submit"
         disabled={loading || !subject.trim() || !message.trim()}
         className="flex-1 bg-primary-500 hover:bg-primary-600 text-white rounded-[8px] py-4 font-bold text-lg shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
         {loading ? 'Skickar...' : '📤 Skicka feedback'}
        </button>
       </div>
      </form>
     </div>

     {/* Help Text */}
     <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-[8px] p-4 border border-blue-200 dark:border-blue-800">
      <p className="text-sm text-blue-800 dark:text-blue-300">
       <strong>💡 Tips:</strong> För buggrapporter, inkludera gärna skärmdumpar och beskriv exakt vad du gjorde innan problemet uppstod. 
       Det hjälper oss att lösa problemet snabbare!
      </p>
     </div>
    </div>
   </main>
  </div>
 )
}

function FeedbackLoading() {
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
     <div className="mb-8 flex flex-col items-center">
      <FrostLogo size={48} />
      <h1 className="text-4xl sm:text-5xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white">
       Feedback & Support
      </h1>
      <p className="text-gray-600 dark:text-gray-400 text-center">Laddar...</p>
     </div>
    </div>
   </main>
  </div>
 )
}

export default function FeedbackPage() {
 return (
  <Suspense fallback={<FeedbackLoading />}>
   <FeedbackContent />
  </Suspense>
 )
}
