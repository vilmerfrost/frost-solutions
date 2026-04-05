'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { portalFetch, getPortalUser, getPortalToken } from '../lib/portal-client-auth'

interface PortalProject {
  id: string
  name: string
  status: string
  created_at: string
  updated_at: string
  unread_messages: number
}

interface DashboardData {
  projects: PortalProject[]
}

const STATUS_LABELS: Record<string, string> = {
  planning: 'Planering',
  in_progress: 'Pagaende',
  completed: 'Avslutad',
  on_hold: 'Pausad',
  cancelled: 'Avbruten',
}

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  in_progress: 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  on_hold: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

export default function PortalDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const user = getPortalUser()

  useEffect(() => {
    const token = getPortalToken()
    if (!token) {
      router.push('/portal/login')
      return
    }

    portalFetch<{ data: DashboardData }>('/portal/dashboard')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300">
        {error}
      </div>
    )
  }

  const totalUnread = data?.projects.reduce((sum, p) => sum + p.unread_messages, 0) ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Valkommen, {user?.name ?? 'Kund'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Har ser du en oversikt av dina projekt
          </p>
        </div>
      </div>

      {/* Unread messages alert */}
      {totalUnread > 0 && (
        <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl flex items-center gap-3">
          <span className="text-primary-600 dark:text-primary-400 text-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </span>
          <span className="text-sm font-medium text-primary-700 dark:text-primary-300">
            Du har {totalUnread} olästa meddelanden
          </span>
        </div>
      )}

      {/* Project cards */}
      {!data?.projects.length ? (
        <div className="text-center py-16 text-gray-500 dark:text-gray-400">
          <p className="text-lg">Inga projekt hittades</p>
          <p className="text-sm mt-1">Kontakta din entreprenor om du saknar ett projekt.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.projects.map((project) => (
            <button
              key={project.id}
              onClick={() => router.push(`/portal/projects/${project.id}`)}
              className="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {project.name}
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[project.status] ?? STATUS_COLORS.planning}`}>
                  {STATUS_LABELS[project.status] ?? project.status}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>Uppdaterad {new Date(project.updated_at).toLocaleDateString('sv-SE')}</span>
                {project.unread_messages > 0 && (
                  <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {project.unread_messages} nya
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
