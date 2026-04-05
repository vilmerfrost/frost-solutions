'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useTenant } from '@/context/TenantContext'
import { apiFetch } from '@/lib/http/fetcher'
import { FolderKanban, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'

interface Project {
  id: string
  name: string
  status?: string
}

export default function DocumentsPage() {
  const { tenantId } = useTenant()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return

    async function fetchProjects() {
      try {
        const result = await apiFetch<{ projects?: Project[] }>(
          `/api/projects/list?tenantId=${tenantId}`,
          { cache: 'no-store' }
        )
        setProjects(result.projects ?? [])
      } catch (err) {
        console.error('Error fetching projects:', err)
        setError('Kunde inte ladda projekt')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [tenantId])

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-7 h-7 text-primary-500" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dokument</h1>
          </div>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Välj ett projekt för att visa dess dokument.
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500 dark:text-gray-400">Laddar projekt...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              {error}
            </div>
          ) : projects.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
              Inga projekt hittades.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/documents`}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <FolderKanban className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors">
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Visa dokument
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
