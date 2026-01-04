'use client'

import React from 'react'

interface PillTab {
 id: string
 label: string
 icon?: React.ReactNode
}

interface PillTabsProps {
 tabs: PillTab[]
 activeTab: string
 onChange: (tabId: string) => void
 className?: string
}

export function PillTabs({ tabs, activeTab, onChange, className = '' }: PillTabsProps) {
 return (
  <div className={`flex gap-2 flex-wrap ${className}`}>
   {tabs.map((tab) => (
    <button
     key={tab.id}
     type="button"
     onClick={() => onChange(tab.id)}
     className={`
      px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200
      flex items-center gap-2
      ${activeTab === tab.id
       ? 'bg-primary-500 text-white shadow-sm'
       : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }
     `}
    >
     {tab.icon}
     {tab.label}
    </button>
   ))}
  </div>
 )
}

