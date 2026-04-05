'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAdmin } from '@/hooks/useAdmin'
import { SafeOnlineStatusIndicator } from '@/components/SafeSyncComponents'
import { MobileBottomNav } from './MobileBottomNav'
import {
 LayoutDashboard,
 Users,
 FolderKanban,
 FileText,
 GitBranch,
 Clock,
 CalendarDays,
 HardHat,
 Receipt,
 Banknote,
 Home,
 BarChart3,
 ShieldCheck,
 PackageSearch,
 UserCircle,
 PenTool,
 Settings as SettingsIcon,
 Moon,
 Sun,
 Map,
 MapPin,
 Menu,
 X,
 ChevronDown,
 ChevronRight,
 type LucideIcon,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────

type UserRole = 'admin' | 'supervisor' | 'worker'

interface NavItem {
 label: string
 href: string
 icon: LucideIcon
 roles: UserRole[]
}

interface NavGroup {
 title: string
 items: NavItem[]
}

// ── Navigation Config ──────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
 {
  title: 'ÖVERSIKT',
  items: [
   { label: 'Kontrollpanel', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'worker'] },
  ],
 },
 {
  title: 'PROJEKT',
  items: [
   { label: 'Projekt', href: '/projects', icon: FolderKanban, roles: ['admin', 'supervisor', 'worker'] },
   { label: 'Dokument', href: '/documents', icon: FileText, roles: ['admin', 'supervisor'] },
   { label: 'ATA-hantering', href: '/ata', icon: GitBranch, roles: ['admin', 'supervisor'] },
  ],
 },
 {
  title: 'TID & PERSONAL',
  items: [
   { label: 'Tidrapportering', href: '/time-tracking', icon: Clock, roles: ['admin', 'supervisor', 'worker'] },
   { label: 'Schemaläggning', href: '/scheduling', icon: CalendarDays, roles: ['admin'] },
   { label: 'Anställda', href: '/employees', icon: Users, roles: ['admin'] },
   { label: 'Underentreprenörer', href: '/subcontractors', icon: HardHat, roles: ['admin'] },
  ],
 },
 {
  title: 'EKONOMI',
  items: [
   { label: 'Fakturering', href: '/invoices', icon: Receipt, roles: ['admin'] },
   { label: 'Lönehantering', href: '/payroll', icon: Banknote, roles: ['admin'] },
   { label: 'ROT-avdrag', href: '/rot', icon: Home, roles: ['admin'] },
   { label: 'Rapporter', href: '/reports', icon: BarChart3, roles: ['admin'] },
  ],
 },
 {
  title: 'SÄKERHET',
  items: [
   { label: 'KMA & Säkerhet', href: '/safety', icon: ShieldCheck, roles: ['admin', 'supervisor', 'worker'] },
   { label: 'Materialpriser', href: '/materials/prices', icon: PackageSearch, roles: ['admin', 'supervisor'] },
  ],
 },
 {
  title: 'KUNDPORTAL',
  items: [
   { label: 'Kunder', href: '/clients', icon: UserCircle, roles: ['admin'] },
   { label: 'Avtal & Signering', href: '/contracts', icon: PenTool, roles: ['admin'] },
  ],
 },
]

// ── Collapsed state persistence ────────────────────────

const COLLAPSED_KEY = 'sidebar-collapsed-groups'

function loadCollapsedGroups(): Record<string, boolean> {
 if (typeof window === 'undefined') return {}
 try {
  const stored = localStorage.getItem(COLLAPSED_KEY)
  return stored ? JSON.parse(stored) : {}
 } catch {
  return {}
 }
}

function saveCollapsedGroups(collapsed: Record<string, boolean>) {
 try {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify(collapsed))
 } catch {
  // ignore
 }
}

// ── Component ──────────────────────────────────────────

export default function SidebarClient() {
 const pathname = usePathname()
 const router = useRouter()
 const { theme, toggleTheme } = useTheme()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const [isOpen, setIsOpen] = useState(false)
 const [hydrated, setHydrated] = useState(false)
 const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

 useEffect(() => {
  setHydrated(true)
  setCollapsedGroups(loadCollapsedGroups())
 }, [])

 const toggleGroup = useCallback((title: string) => {
  setCollapsedGroups(prev => {
   const next = { ...prev, [title]: !prev[title] }
   saveCollapsedGroups(next)
   return next
  })
 }, [])

 // Determine user role based on admin status
 const userRole: UserRole = isAdmin ? 'admin' : 'worker'

 // Filter groups based on role
 const filteredGroups = NAV_GROUPS.map(group => ({
  ...group,
  items: group.items.filter(item => item.roles.includes(userRole)),
 })).filter(group => group.items.length > 0)

 if (!hydrated) {
  return null
 }

 return (
  <>
   {/* Mobile menu button */}
   <button
    onClick={() => setIsOpen(!isOpen)}
    className="lg:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 rounded-lg p-2.5 shadow-md border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    aria-label={isOpen ? 'Stäng meny' : 'Öppna meny'}
    aria-expanded={isOpen}
   >
    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
   </button>

   {/* Mobile Bottom Navigation */}
   <MobileBottomNav onMenuClick={() => setIsOpen(true)} />

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
     fixed lg:sticky inset-y-0 left-0 z-40 top-0
     w-64 h-screen bg-gray-900 border-r border-white/10
     transform transition-transform duration-300 ease-in-out
     ${isOpen ? 'translate-x-0' : '-translate-x-full'}
     lg:translate-x-0 lg:z-auto
     shadow-md lg:shadow-none
     overflow-hidden
    `}
    aria-label="Huvudnavigation"
   >
    <div className="h-full flex flex-col">
     {/* Logo */}
     <div className="p-6 border-b border-white/10">
      <div className="flex items-center justify-center">
       <h1 className="text-xl font-semibold text-white">
        Frost Solutions
       </h1>
      </div>
     </div>

     {/* Navigation */}
     <nav id="main-navigation" className="flex-1 p-4 space-y-4 overflow-y-auto" role="navigation">
      {filteredGroups.map((group) => {
       const isCollapsed = collapsedGroups[group.title] || false
       return (
        <div key={group.title}>
         {/* Group header */}
         <button
          onClick={() => toggleGroup(group.title)}
          className="w-full flex items-center justify-between px-3 py-1.5 mb-1"
         >
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
           {group.title}
          </span>
          {isCollapsed
           ? <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
           : <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          }
         </button>

         {/* Group items */}
         {!isCollapsed && (
          <div className="space-y-0.5">
           {group.items.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
             <button
              key={item.href}
              onClick={() => {
               router.push(item.href)
               setIsOpen(false)
              }}
              className={`
               w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px]
               font-medium text-sm transition-all duration-200
               ${
                isActive
                 ? 'bg-primary-500/10 text-primary-500'
                 : 'text-gray-300 hover:bg-white/5 hover:text-white'
               }
              `}
              aria-current={isActive ? 'page' : undefined}
             >
              <Icon className="w-5 h-5" />
              <span className="truncate">{item.label}</span>
             </button>
            )
           })}
          </div>
         )}
        </div>
       )
      })}
     </nav>

     {/* Footer */}
     <div className="p-4 border-t border-white/10 space-y-1">
      {/* Online Status Indicator */}
      <div className="mb-2">
       <SafeOnlineStatusIndicator />
      </div>

      <button
       onClick={toggleTheme}
       className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
       aria-label={`Byt till ${theme === 'light' ? 'mörkt' : 'ljust'} läge`}
      >
       {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
       <span>{theme === 'light' ? 'Mörkt läge' : 'Ljust läge'}</span>
      </button>

      {!adminLoading && isAdmin && (
       <>
        <button
         onClick={() => router.push('/admin')}
         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
         aria-label="Gå till admin-panel"
        >
         <SettingsIcon className="w-5 h-5" aria-hidden="true" />
         <span>Admin</span>
        </button>
        <button
         onClick={() => router.push('/admin/work-sites')}
         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
         aria-label="Hantera arbetsplatser"
        >
         <Map className="w-5 h-5" aria-hidden="true" />
         <span>Arbetsplatser</span>
        </button>
        <button
         onClick={() => router.push('/admin/live-map')}
         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
         aria-label="Visa live-karta"
        >
         <MapPin className="w-5 h-5" aria-hidden="true" />
         <span>Live Karta</span>
        </button>
       </>
      )}
     </div>
    </div>
   </aside>
  </>
 )
}
