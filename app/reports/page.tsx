'use client'

import dynamic from 'next/dynamic'

const ReportsContent = dynamic(() => import('./ReportsContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="animate-pulse text-gray-400 dark:text-gray-500">Laddar rapporter...</div>
    </div>
  ),
})

export default function ReportsPage() {
  return <ReportsContent />
}
