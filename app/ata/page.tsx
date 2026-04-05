'use client'

import Sidebar from '@/components/Sidebar'
import { GitBranch } from 'lucide-react'

export default function AtaPage() {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center max-w-md">
            <GitBranch className="w-12 h-12 text-primary-500 mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
              ATA-hantering
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Kommer snart
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
