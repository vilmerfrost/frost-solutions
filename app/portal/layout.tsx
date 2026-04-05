'use client'

import { usePathname, useRouter } from 'next/navigation'
import FrostLogo from '@/components/FrostLogo'
import { clearPortalToken, clearPortalUser, getPortalToken, getPortalUser } from './lib/portal-client-auth'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === '/portal/login'
  const token = getPortalToken()
  const user = getPortalUser()

  function handleLogout() {
    clearPortalToken()
    clearPortalUser()
    router.push('/portal/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FrostLogo size={36} />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Frost Solutions</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Kundportal</span>
          </div>
          {!isLoginPage && token && (
            <nav className="flex items-center gap-4">
              <button
                onClick={() => router.push('/portal/dashboard')}
                className={`text-sm font-medium ${
                  pathname === '/portal/dashboard'
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Mina projekt
              </button>
              {user && (
                <span className="text-sm text-gray-500 dark:text-gray-400 hidden md:inline">
                  {user.name}
                </span>
              )}
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Logga ut
              </button>
            </nav>
          )}
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
