'use client'

import { Clock, FileText, FolderPlus, AlertTriangle } from 'lucide-react'
import { BASE_PATH } from '@/utils/url'

type Action = { icon: React.ReactNode; label: string; href: string; color?: string }
const actions: Action[] = [
 { icon: <Clock className="w-6 h-6" />, label: "Rapportera tid", href: "/reports/new", color: "blue-600" },
 { icon: <FileText className="w-6 h-6" />, label: "Skapa faktura", href: "/invoices/new" },
 { icon: <FolderPlus className="w-6 h-6" />, label: "Nytt projekt", href: "/projects/new" },
 { icon: <AlertTriangle className="w-6 h-6" />, label: "ÄTA-arbete", href: "/aeta", color: "yellow-500" },
]

export default function QuickActions() {
 return (
  <div className="flex flex-wrap gap-4 mb-6">
   {actions.map(a =>
    <a
     key={a.label}
     href={`${BASE_PATH}${a.href}`}
     className={`flex flex-col items-center px-4 py-2 rounded-lg shadow bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors`}
    >
     <span className={`text-${a.color || 'blue-600'}`}>{a.icon}</span>
     <span className="mt-1 text-xs text-gray-700 dark:text-gray-300">{a.label}</span>
    </a>
   )}
  </div>
 )
}
