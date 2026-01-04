// app/components/MobileBottomNav.tsx
'use client'

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, FolderKanban, Clock, Menu } from 'lucide-react'

interface MobileBottomNavProps {
  onMenuClick: () => void
}

export function MobileBottomNav({ onMenuClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const mainNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Projekt', href: '/projects', icon: FolderKanban },
    { name: 'Tid', href: '/reports/new', icon: Clock },
    { name: 'Mer', onClick: onMenuClick, icon: Menu },
  ]

  const isActive = (href?: string) => {
    if (!href) return false
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-area-inset-bottom">
      <div className="grid grid-cols-4 h-16">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          const active = item.href ? isActive(item.href) : false
          
          return (
            <button
              key={item.name}
              onClick={() => {
                if (item.onClick) {
                  item.onClick()
                } else if (item.href) {
                  router.push(item.href)
                }
              }}
              className={`
                flex flex-col items-center justify-center gap-1
                transition-colors duration-200
                ${active 
                  ? 'text-primary-500 bg-primary-50 dark:bg-primary-500/10' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{item.name}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

