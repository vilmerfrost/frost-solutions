'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { useAdmin } from '@/hooks/useAdmin'
import { SafeOnlineStatusIndicator } from '@/components/SafeSyncComponents'
import { MobileBottomNav } from './MobileBottomNav'
import { 
 LayoutDashboard, 
 Users, 
 FolderKanban, 
 Archive, 
 Briefcase, 
 FileText, 
 Package, 
 Leaf,
 Receipt, 
 Download,
 DollarSign,
 Wallet,
 BarChart3,
 Calendar,
 ClipboardList,
 PieChart,
 Home,
 MessageCircle,
 HelpCircle,
 Palette,
 Link,
 FileCheck,
 Settings as SettingsIcon,
 Moon,
 Sun,
 MapPin,
 Map,
 Menu,
 X,
 CreditCard
} from 'lucide-react'

interface NavItem {
 name: string
 href: string
 icon: React.ReactNode
}

const navItems: NavItem[] = [
 { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
 { name: 'Anställda', href: '/employees', icon: <Users className="w-5 h-5" /> },
 { name: 'Projekt', href: '/projects', icon: <FolderKanban className="w-5 h-5" /> },
 { name: 'Arkiv', href: '/projects/archive', icon: <Archive className="w-5 h-5" /> },
 { name: 'Kunder', href: '/clients', icon: <Briefcase className="w-5 h-5" /> },
 { name: 'Offerter', href: '/quotes', icon: <FileText className="w-5 h-5" /> },
 { name: 'Materialdatabas', href: '/materials', icon: <Package className="w-5 h-5" /> },
 { name: 'KMA', href: '/kma', icon: <Leaf className="w-5 h-5" /> },
 { name: 'Fakturor', href: '/invoices', icon: <Receipt className="w-5 h-5" /> },
 { name: 'Leverantörsfakturor', href: '/supplier-invoices', icon: <Download className="w-5 h-5" /> },
 { name: 'Löneexport', href: '/payroll/periods', icon: <DollarSign className="w-5 h-5" /> },
 { name: 'Lönespec', href: '/payroll', icon: <Wallet className="w-5 h-5" /> },
 { name: 'Rapporter', href: '/reports', icon: <BarChart3 className="w-5 h-5" /> },
 { name: 'Kalender', href: '/calendar', icon: <Calendar className="w-5 h-5" /> },
 { name: 'Arbetsordrar', href: '/work-orders', icon: <ClipboardList className="w-5 h-5" /> },
 { name: 'Analytics', href: '/analytics', icon: <PieChart className="w-5 h-5" /> },
 { name: 'ROT-avdrag', href: '/rot', icon: <Home className="w-5 h-5" /> },
 { name: 'ÄTA', href: '/aeta', icon: <FileText className="w-5 h-5" /> },
 { name: 'Feedback', href: '/feedback', icon: <MessageCircle className="w-5 h-5" /> },
 { name: 'FAQ', href: '/faq', icon: <HelpCircle className="w-5 h-5" /> },
 { name: 'Utseende', href: '/settings/utseende', icon: <Palette className="w-5 h-5" /> },
 { name: 'Integrationer', href: '/settings/integrations', icon: <Link className="w-5 h-5" /> },
 { name: 'Prenumeration', href: '/settings/subscription', icon: <CreditCard className="w-5 h-5" /> },
 { name: 'Följesedlar', href: '/delivery-notes', icon: <FileCheck className="w-5 h-5" /> },
 { name: 'Arbetsflöden', href: '/workflows', icon: <SettingsIcon className="w-5 h-5" /> },
]

const adminNavItems: NavItem[] = []

export default function SidebarClient() {
 const pathname = usePathname()
 const router = useRouter()
 const { theme, toggleTheme } = useTheme()
 const { isAdmin, loading: adminLoading } = useAdmin()
 const [isOpen, setIsOpen] = useState(false)
 const [hydrated, setHydrated] = useState(false)

 useEffect(() => {
  setHydrated(true)
 }, [])

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
     w-64 h-screen bg-[#1e293b] border-r border-white/10
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
     <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
       const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
       return (
        <button
         key={item.name}
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
         {item.icon}
         <span className="truncate">{item.name}</span>
        </button>
       )
      })}
      
      {/* Admin-only items */}
      {adminNavItems.length > 0 && isAdmin && (
       <>
        <div className="pt-4 mt-4 border-t border-white/10">
         <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
           {item.icon}
           <span className="truncate">{item.name}</span>
          </button>
         )
        })}
       </>
      )}
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
        >
         <SettingsIcon className="w-5 h-5" />
         <span>Admin</span>
        </button>
        <button
         onClick={() => router.push('/admin/work-sites')}
         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
        >
         <Map className="w-5 h-5" />
         <span>Arbetsplatser</span>
        </button>
        <button
         onClick={() => router.push('/admin/live-map')}
         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
        >
         <MapPin className="w-5 h-5" />
         <span>Live Karta</span>
        </button>
        <button
         onClick={() => router.push('/admin/aeta')}
         className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] text-gray-300 hover:bg-white/5 hover:text-white font-medium text-sm transition-all duration-200"
        >
         <FileText className="w-5 h-5" />
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

