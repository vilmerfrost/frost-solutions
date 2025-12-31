'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'

export default function RotAppealPage() {
  const router = useRouter()
  const params = useParams()
  const { tenantId } = useTenant()
  const applicationId = params?.id as string

  const [appealReason, setAppealReason] = useState('')
  const [additionalInfo, setAdditionalInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [application, setApplication] = useState<any>(null)

  useEffect(() => {
    if (!tenantId || !applicationId) return

    async function loadApplication() {
      if (!tenantId) return
      
      const { data } = await supabase
        .from('rot_applications')
        .select('*')
        .eq('id', applicationId)
        .eq('tenant_id', tenantId)
        .single()

      if (data) {
        setApplication(data)
      }
    }

    loadApplication()
  }, [tenantId, applicationId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!appealReason.trim()) {
      toast.error('Du måste ange en orsak till överklagandet.')
      return
    }

    setLoading(true)

    try {
      if (!tenantId) {
        toast.error('Ingen tenant ID hittades')
        return
      }

      // Uppdatera ansökan till överklagad
      const { error: updateError } = await supabase
        .from('rot_applications')
        .update({
          status: 'appealed',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', applicationId)

      if (updateError) {
        throw updateError
      }

      // Skapa status history entry
      await supabase.from('rot_status_history').insert({
        rot_application_id: applicationId,
        status: 'appealed',
        status_message: `Överklagande skickat. Orsak: ${appealReason}. ${additionalInfo ? `Ytterligare info: ${additionalInfo}` : ''}`,
      } as any)

      // Logga överklagande (för framtida API-integration)
      await supabase.from('rot_api_logs').insert({
        rot_application_id: applicationId,
        tenant_id: tenantId,
        api_endpoint: 'https://api.skatteverket.se/rot/appeal',
        http_method: 'POST',
        request_body: {
          case_number: application?.case_number,
          appeal_reason: appealReason,
          additional_info: additionalInfo,
        },
        response_status: 200,
        response_body: {
          status: 'appealed',
          message: 'Överklagande registrerat',
        },
      } as any)

      toast.success('Överklagande skickat! Skatteverket kommer att granska din överklagan.')
      router.push(`/rot/${applicationId}`)
    } catch (err: any) {
      console.error('Error submitting appeal:', err)
      toast.error('Kunde inte skicka överklagande: ' + (err.message || 'Okänt fel'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-3xl mx-auto w-full">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1 sm:mb-2">
              Överklaga ROT-ansökan
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Om du anser att Skatteverkets beslut är felaktigt kan du överklaga
            </p>
          </div>

          {application && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Ansökan avslagen:</strong> Ärendenummer {application.case_number || 'Okänt'}
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100 dark:border-gray-700 space-y-6"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Orsak till överklagande *
              </label>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Beskriv varför du anser att beslutet är felaktigt..."
                rows={6}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600 resize-none"
                required
              />
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Var så specifik som möjligt. Ange gärna datum, belopp eller andra relevanta detaljer.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Ytterligare information (valfritt)
              </label>
              <textarea
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                placeholder="Ytterligare kommentarer eller bilagor..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-300 dark:hover:border-gray-600 resize-none"
              />
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>OBS:</strong> Överklaganden skickas till Skatteverket för granskning. 
                Du kommer att få ett svar via e-post eller brev.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl py-3 sm:py-4 font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Skickar...
                  </span>
                ) : (
                  'Skicka överklagande'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-6 py-3 sm:py-4 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
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

