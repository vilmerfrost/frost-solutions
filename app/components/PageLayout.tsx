'use client'

import { ReactNode } from 'react'
import Sidebar from './Sidebar'

interface PageLayoutProps {
 children: ReactNode
 title?: string
 subtitle?: string
 actions?: ReactNode
}

export default function PageLayout({ children, title, subtitle, actions }: PageLayoutProps) {
 return (
  <div className="min-h-screen bg-white flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {(title || actions) && (
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
       {title && (
        <div>
         <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 mb-1 sm:mb-2">{title}</h1>
         {subtitle && <p className="text-sm sm:text-base text-gray-500">{subtitle}</p>}
        </div>
       )}
       {actions && <div className="w-full sm:w-auto">{actions}</div>}
      </div>
     )}
     {children}
    </div>
   </main>
  </div>
 )
}

