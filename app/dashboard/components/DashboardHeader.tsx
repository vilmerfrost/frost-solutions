'use client'

import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import supabase from '@/utils/supabase/supabaseClient'
import { clearTenantNotifications } from '@/lib/notifications'

const NotificationCenter = dynamic(() => import('@/components/NotificationCenter'), {
  loading: () => <div className="h-12 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />,
})

interface DashboardHeaderProps {
  userEmail: string | null
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter()

  return (
    <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">Kontrollpanel</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Välkommen tillbaka, {userEmail?.split('@')[0] || 'Användare'}!</p>
      </div>
      <div className="flex gap-3 items-center">
        <NotificationCenter className="hidden sm:block" />
        <button
          onClick={() => router.push('/reports/new')}
          className="w-full sm:w-auto bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-[6px] font-medium shadow-sm hover:shadow-md hover:-translate-y-[1px] transition-all text-sm sm:text-base"
          aria-label="Rapportera tid"
        >
          Rapportera tid
        </button>
        <button
          onClick={async () => {
            if (confirm('Är du säker på att du vill logga ut?')) {
              // SECURITY: Clear tenant-specific data before logout
              clearTenantNotifications()
              localStorage.removeItem('tenant_id')
              await supabase.auth.signOut()
              router.push('/login')
            }
          }}
          className="w-full sm:w-auto bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-[6px] font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm sm:text-base"
          aria-label="Logga ut"
        >
          Logga ut
        </button>
      </div>
    </div>
  )
}
