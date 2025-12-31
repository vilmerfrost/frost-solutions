'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import supabase from '@/utils/supabase/supabaseClient'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { toast } from '@/lib/toast'

export default function ProjectsArchivePage() {
  const router = useRouter()
  const { tenantId } = useTenant()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    async function fetchArchivedProjects() {
      try {
        // Try with status first - only show completed/archived projects
        if (!tenantId) return
        
        let { data, error } = await supabase
          .from('projects')
          .select('id, name, customer_name, created_at, base_rate_sek, budgeted_hours, status')
          .eq('tenant_id', tenantId)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })

        // If status column doesn't exist or query fails, try without filter
        if (error && (error.code === '42703' || error.message?.includes('does not exist') || error.message?.includes('status'))) {
          // If no status column, we can't filter - show empty archive
          setProjects([])
        } else if (error) {
          console.error('Error fetching archived projects:', error)
          setProjects([])
        } else {
          setProjects((data || []).map((p: any) => ({ ...p, status: p.status || 'completed' })))
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setProjects([])
      } finally {
        setLoading(false)
      }
    }

    fetchArchivedProjects()
  }, [tenantId])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-800 flex">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2">Arkiverade projekt</h1>
              <p className="text-gray-500 dark:text-gray-400">Projekt som markerats som klara</p>
            </div>
            <button
              onClick={() => router.push('/projects')}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
            >
              ← Tillbaka till projekt
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">Inga arkiverade projekt hittades</p>
              <button
                onClick={() => router.push('/projects')}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold"
              >
                Gå till aktiva projekt
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((p: any) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/projects/${p.id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 opacity-75 hover:opacity-100"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{p.name}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      Slutförd
                    </span>
                  </div>
                  {p.customer_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Kund: {p.customer_name}</p>
                  )}
                  <p className="text-xs text-gray-400 mb-4">
                    Skapad: {p.created_at ? new Date(p.created_at).toLocaleDateString('sv-SE') : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

