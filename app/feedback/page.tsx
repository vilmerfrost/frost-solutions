'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import FrostLogo from '@/components/FrostLogo'
import { toast } from '@/lib/toast'
import supabase from '@/utils/supabase/supabaseClient'
import AISummary from '@/components/AISummary'

export default function FeedbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Pre-fill from URL params (for bug reports from errors)
  const typeParam = searchParams?.get('type') as 'bug' | 'feature' | 'other' | null
  const subjectParam = searchParams?.get('subject') || ''
  const messageParam = searchParams?.get('message') || ''
  
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'other'>(typeParam || 'bug')
  const [subject, setSubject] = useState(subjectParam)
  const [message, setMessage] = useState(messageParam)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Update form when URL params change
  useEffect(() => {
    if (typeParam) setFeedbackType(typeParam)
    if (subjectParam) setSubject(subjectParam)
    if (messageParam) setMessage(messageParam)
  }, [typeParam, subjectParam, messageParam])

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
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Kunde inte skicka feedback')
      }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col lg:flex-row">
      <Sidebar />
      
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-4xl mx-auto w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col items-center">
            <FrostLogo size={48} />
            <h1 className="text-4xl sm:text-5xl font-black mt-4 mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Feedback & Support
            </h1>
            <p className="text-gray-600 text-center">
              Rapportera buggar, föreslå funktioner eller dela din feedback
            </p>
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
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 sm:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Typ av feedback *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('bug')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      feedbackType === 'bug'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🐛 Buggrapport
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      feedbackType === 'feature'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💡 Funktionförslag
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('other')}
                    className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                      feedbackType === 'other'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    📝 Övrigt
                  </button>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Din e-post
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="din@email.se"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lämna tomt för att använda din inloggade e-post
                </p>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ämne *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={feedbackType === 'bug' ? 'Beskriv buggen kortfattat...' : 'Vad vill du dela med dig?'}
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Meddelande *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
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
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={loading || !subject.trim() || !message.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white rounded-xl py-4 font-bold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Skickar...' : '📤 Skicka feedback'}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>💡 Tips:</strong> För buggrapporter, inkludera gärna skärmdumpar och beskriv exakt vad du gjorde innan problemet uppstod. 
              Det hjälper oss att lösa problemet snabbare!
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

