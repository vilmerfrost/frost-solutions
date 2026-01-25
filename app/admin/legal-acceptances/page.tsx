'use client'

import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import supabase from '@/utils/supabase/supabaseClient'

interface Acceptance {
  id: string
  user_id: string
  tenant_id: string | null
  document_type: string
  document_version: string
  accepted_at: string
  ip_address: string | null
  user_agent: string | null
  acceptance_method: string
}

export default function LegalAcceptancesPage() {
  const [acceptances, setAcceptances] = useState<Acceptance[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'terms' | 'privacy' | 'dpa' | 'sla'>('all')

  useEffect(() => {
    async function fetchAcceptances() {
      try {
        let query = supabase
          .from('legal_acceptances')
          .select('*')
          .order('accepted_at', { ascending: false })
          .limit(100)

        if (filter !== 'all') {
          query = query.eq('document_type', filter)
        }

        const { data, error } = await query

        if (error) {
          console.error('Error fetching acceptances:', error)
        } else {
          setAcceptances(data || [])
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchAcceptances()
  }, [filter])

  const filteredAcceptances = filter === 'all' 
    ? acceptances 
    : acceptances.filter(a => a.document_type === filter)

  const stats = {
    total: acceptances.length,
    terms: acceptances.filter(a => a.document_type === 'terms').length,
    privacy: acceptances.filter(a => a.document_type === 'privacy').length,
    dpa: acceptances.filter(a => a.document_type === 'dpa').length,
    sla: acceptances.filter(a => a.document_type === 'sla').length,
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500 dark:text-gray-400">Laddar...</div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
              Legal Acceptances
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              Översikt över accepterade juridiska dokument
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Totalt</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.terms}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Villkor</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.privacy}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Integritet</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.dpa}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">DPA</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.sla}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">SLA</div>
            </div>
          </div>

          {/* Filter */}
          <div className="mb-6 flex gap-2 flex-wrap">
            {(['all', 'terms', 'privacy', 'dpa', 'sla'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {f === 'all' ? 'Alla' : f === 'terms' ? 'Villkor' : f === 'privacy' ? 'Integritet' : f.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
            {filteredAcceptances.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Inga acceptances hittades.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Dokument
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Version
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Metod
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        IP-adress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Accepterad
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAcceptances.map((acceptance) => (
                      <tr key={acceptance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {acceptance.user_id.slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            acceptance.document_type === 'terms' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : acceptance.document_type === 'privacy'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : acceptance.document_type === 'dpa'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                          }`}>
                            {acceptance.document_type === 'terms' ? 'Villkor' :
                             acceptance.document_type === 'privacy' ? 'Integritet' :
                             acceptance.document_type.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {acceptance.document_version}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {acceptance.acceptance_method === 'signup' ? 'Registrering' :
                           acceptance.acceptance_method === 'checkout' ? 'Kassa' :
                           acceptance.acceptance_method === 'manual' ? 'Manuell' :
                           'API'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {acceptance.ip_address || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(acceptance.accepted_at).toLocaleString('sv-SE', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
