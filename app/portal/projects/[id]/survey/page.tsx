'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { portalFetch, getPortalToken } from '../../../lib/portal-client-auth'

interface SurveyQuestion {
  id: string
  question: string
  type: 'rating' | 'text'
  scale?: { min: number; max: number }
}

interface SurveyData {
  questions: SurveyQuestion[]
  already_submitted: boolean
  submitted_at: string | null
}

export default function PortalSurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params)
  const router = useRouter()
  const [survey, setSurvey] = useState<SurveyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, number | string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const token = getPortalToken()
    if (!token) {
      router.push('/portal/login')
      return
    }

    portalFetch<{ data: SurveyData }>(`/portal/projects/${projectId}/survey`)
      .then((res) => {
        setSurvey(res.data)
        if (res.data.already_submitted) {
          setSubmitted(true)
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [projectId, router])

  function setRating(questionId: string, value: number) {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  function setText(questionId: string, value: string) {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
  }

  async function handleSubmit() {
    if (!survey) return
    setSubmitting(true)
    setError(null)

    const responsePayload = survey.questions.map((q) => {
      const val = responses[q.id]
      if (q.type === 'rating') {
        return { question_id: q.id, rating: typeof val === 'number' ? val : undefined }
      }
      return { question_id: q.id, text: typeof val === 'string' ? val : undefined }
    })

    try {
      await portalFetch(`/portal/projects/${projectId}/survey`, {
        method: 'POST',
        body: JSON.stringify({ responses: responsePayload }),
      })
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte skicka enkaten')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Thank you screen
  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Tack for din feedback!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Din feedback hjalper oss att forbattra vara tjanster. Vi uppskattar att du tog dig tid.
        </p>
        <button
          onClick={() => router.push('/portal/dashboard')}
          className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Tillbaka till mina projekt
        </button>
      </div>
    )
  }

  if (error && !survey) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Tillbaka
      </button>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Kundnojdhetsundersokning
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Hjálp oss att forbattra vara tjanster genom att svara pa nagra korta fragor.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="space-y-8">
          {survey?.questions.map((q) => (
            <div key={q.id}>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                {q.question}
              </label>

              {q.type === 'rating' && q.scale && (
                <div className="flex gap-2">
                  {Array.from(
                    { length: q.scale.max - q.scale.min + 1 },
                    (_, i) => q.scale!.min + i
                  ).map((val) => {
                    const isNps = q.scale!.max === 10
                    const selected = responses[q.id] === val

                    return (
                      <button
                        key={val}
                        onClick={() => setRating(q.id, val)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors border ${
                          selected
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
                        }`}
                      >
                        {isNps ? val : val === 1 ? '1' : val === q.scale!.max ? `${val}` : val}
                      </button>
                    )
                  })}
                </div>
              )}

              {q.type === 'rating' && q.scale && (
                <div className="flex justify-between mt-1 text-xs text-gray-400 dark:text-gray-500">
                  <span>{q.scale.max === 10 ? 'Inte alls sannolikt' : 'Daligt'}</span>
                  <span>{q.scale.max === 10 ? 'Mycket sannolikt' : 'Utmarkt'}</span>
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  value={(responses[q.id] as string) || ''}
                  onChange={(e) => setText(q.id, e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
                  placeholder="Skriv din kommentar har..."
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {submitting ? 'Skickar...' : 'Skicka feedback'}
          </button>
        </div>
      </div>
    </div>
  )
}
