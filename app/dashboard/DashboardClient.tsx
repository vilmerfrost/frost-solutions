'use client'

import dynamic from 'next/dynamic'
import { useTenant } from '@/context/TenantContext'
import Sidebar from '@/components/Sidebar'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardStats } from './components/DashboardStats'
import { DashboardProjects } from './components/DashboardProjects'
import { DashboardTimeTracking } from './components/DashboardTimeTracking'

const WeeklySchedules = dynamic(
  () => import('@/components/dashboard/WeeklySchedulesComponent').then(mod => ({ default: mod.WeeklySchedules })),
  { loading: () => <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" /> }
)

const InvoiceList = dynamic(() => import('@/components/invoice-list'), {
  loading: () => <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg animate-pulse" />,
})

const SubscriptionBanner = dynamic(
  () => import('@/components/subscription/SubscriptionBanner').then(mod => ({ default: mod.SubscriptionBanner })),
  { ssr: false }
)

interface DashboardClientProps {
  userEmail: string | null
  stats: {
    totalHours: number
    activeProjects: number
    invoicesToSend: number
  }
}

export default function DashboardClient({ userEmail, stats }: DashboardClientProps) {
  const { tenantId } = useTenant()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />

      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <SubscriptionBanner />

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <DashboardHeader userEmail={userEmail} />

          <WeeklySchedules />

          {tenantId && <DashboardTimeTracking tenantId={tenantId} />}

          {tenantId && (
            <div className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">Leverantörsfakturor</h2>
              <InvoiceList tenantId={tenantId} />
            </div>
          )}

          {tenantId && <DashboardStats tenantId={tenantId} initialStats={stats} />}

          {tenantId && <DashboardProjects tenantId={tenantId} />}
        </div>
      </main>
    </div>
  )
}
