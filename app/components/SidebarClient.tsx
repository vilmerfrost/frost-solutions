'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAdmin } from '@/hooks/useAdmin'
import NotificationCenter from '@/components/NotificationCenter'
import { SafeOnlineStatusIndicator } from '@/components/SafeSyncComponents'
import { SearchBar } from '@/components/search/SearchBar'

interface NavItem {
  name: string
  href: string
  icon: string
  gradient: string
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', gradient: 'from-pink-500 to-purple-600' },
  { name: 'Anställda', href: '/employees', icon: '👥', gradient: 'from-purple-500 to-blue-600' },
  { name: 'Projekt', href: '/projects', icon: '🏗️', gradient: 'from-blue-500 to-cyan-600' },
  { name: 'Arkiv', href: '/projects/archive', icon: '📦', gradient: 'from-gray-500 to-gray-600' },
  { name: 'Kunder', href: '/clients', icon: '👔', gradient: 'from-cyan-500 to-teal-600' },
  { name: 'Offerter', href: '/quotes', icon: '📄', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Materialdatabas', href: '/materials', icon: '📦', gradient: 'from-teal-500 to-green-600' },
  { name: 'KMA', href: '/kma', icon: '🌱', gradient: 'from-lime-500 to-green-600' },
  { name: 'Fakturor', href: '/invoices', icon: '🧾', gradient: 'from-teal-500 to-green-600' },
  { name: 'Leverantörsfakturor', href: '/supplier-invoices', icon: '📥', gradient: 'from-emerald-500 to-teal-600' },
  { name: 'Löneexport', href: '/payroll/periods', icon: '💰', gradient: 'from-purple-500 to-pink-600' },
  { name: 'Lönespec', href: '/payroll', icon: '💵', gradient: 'from-green-500 to-teal-600' },
  { name: 'Rapporter', href: '/reports', icon: '📈', gradient: 'from-green-500 to-emerald-600' },
  { name: 'Kalender', href: '/calendar', icon: '📅', gradient: 'from-purple-500 to-pink-600' },
  { name: 'Arbetsordrar', href: '/work-orders', icon: '📋', gradient: 'from-orange-500 to-red-600' },
  { name: 'Analytics', href: '/analytics', icon: '📊', gradient: 'from-indigo-500 to-purple-600' },
  { name: 'ROT-avdrag', href: '/rot', icon: '🏠', gradient: 'from-orange-500 to-red-600' },
  { name: 'ÄTA', href: '/aeta', icon: '⚠️', gradient: 'from-yellow-500 to-orange-600' },
  { name: 'Feedback', href: '/feedback', icon: '💬', gradient: 'from-green-500 to-emerald-600' },
  { name: 'FAQ', href: '/faq', icon: '❓', gradient: 'from-blue-500 to-indigo-600' },
  { name: 'Utseende', href: '/settings/utseende', icon: '🎨', gradient: 'from-indigo-500 to-purple-600' },
  { name: 'Integrationer', href: '/integrations', icon: '🔗', gradient: 'from-fuchsia-500 to-purple-600' },
]

const adminNavItems: NavItem[] = [
  // Integrationer finns redan i navItems, inga extra admin-items behövs
]

export default function SidebarClient() {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const [isOpen, setIsOpen] = useState(false) // Start closed on mobile
  const [showSearchBar, setShowSearchBar] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Fix hydration mismatch - only render client-side content after mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Debug: Log admin status (bara i development, client-side only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Sidebar - Admin status:', { isAdmin, adminLoading, navItemsCount: adminNavItems.length })
    }
  }, [isAdmin, adminLoading])

  useEffect(() => {
    setShowSearchBar(true)
  }, [])

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label={isOpen ? 'Stäng meny' : 'Öppna meny'}
        aria-expanded={isOpen}
      >
        <span className="text-xl sm:text-2xl" aria-hidden="true">{isOpen ? '✕' : '☰'}</span>
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false)
          }}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 sm:w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-auto
          shadow-lg lg:shadow-none
        `}
        aria-label="Huvudnavigation"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-center mb-4">
              <div className="text-xl sm:text-2xl font-black bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent truncate">
                Frost Solutions
              </div>
            </div>
            {/* Global Search Bar */}
            <div className="mt-4">
              {showSearchBar ? (
                <SearchBar />
              ) : (
                <div className="relative w-full max-w-2xl mx-auto">
                  <div className="relative animate-pulse">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700" />
                    </div>
                    <div className="w-full pl-12 pr-24 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    router.push(item.href)
                    setIsOpen(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      router.push(item.href)
                      setIsOpen(false)
                    }
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    font-semibold text-sm transition-all duration-200
                    ${
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }
                  `}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Gå till ${item.name}`}
                >
                  <span className="text-xl flex-shrink-0" aria-hidden="true" suppressHydrationWarning>{item.icon}</span>
                  <span className="truncate" suppressHydrationWarning>{item.name}</span>
                </button>
              )
            })}
            
            {/* Admin-only items - Visa alltid om användaren är admin */}
            {/* Only render admin items after mount to prevent hydration mismatch */}
            {isMounted && adminNavItems.length > 0 && isAdmin && (
              <>
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="px-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Administratör
                  </p>
                </div>
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href)
                        setIsOpen(false)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          router.push(item.href)
                          setIsOpen(false)
                        }
                      }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl
                        font-semibold text-sm transition-all duration-200
                        ${
                          isActive
                            ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }
                      `}
                      aria-current={isActive ? 'page' : undefined}
                      aria-label={`Gå till ${item.name}`}
                    >
                      <span className="text-xl flex-shrink-0" aria-hidden="true" suppressHydrationWarning>{item.icon}</span>
                      <span className="truncate" suppressHydrationWarning>{item.name}</span>
                    </button>
                  )
                })}
              </>
            )}
          </nav>

          {/* Footer - Only show admin options if user is admin */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
            {/* Online Status Indicator */}
            <div className="mb-2">
              <SafeOnlineStatusIndicator />
            </div>
            
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
              aria-label={`Byt till ${theme === 'light' ? 'mörkt' : 'ljust'} läge`}
            >
              <span className="text-xl" aria-hidden="true">{theme === 'light' ? '🌙' : '☀️'}</span>
              <span>{theme === 'light' ? 'Mörkt läge' : 'Ljust läge'}</span>
            </button>
            
            {isMounted && !adminLoading && isAdmin && (
              <>
                <button
                  onClick={() => router.push('/admin')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
                  aria-label="Gå till admin"
                >
                  <span className="text-xl" aria-hidden="true">⚙️</span>
                  <span>Admin</span>
                </button>
                <button
                  onClick={() => router.push('/admin/work-sites')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
                  aria-label="Arbetsplatser"
                >
                  <span className="text-xl" aria-hidden="true">🗺️</span>
                  <span>Arbetsplatser</span>
                </button>
                <button
                  onClick={() => router.push('/admin/live-map')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
                  aria-label="Live karta"
                >
                  <span className="text-xl" aria-hidden="true">📍</span>
                  <span>Live Karta</span>
                </button>
                <button
                  onClick={() => router.push('/admin/debug')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
                  aria-label="Admin debug"
                >
                  <span className="text-xl" aria-hidden="true">🔍</span>
                  <span>Admin Debug</span>
                </button>
                <button
                  onClick={() => router.push('/admin/aeta')}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold text-sm transition-colors"
                  aria-label="Gå till ÄTA admin"
                >
                  <span className="text-xl" aria-hidden="true">⚠️</span>
                  <span>ÄTA Admin</span>
                </button>
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

