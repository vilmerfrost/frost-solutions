'use client'

import React, { useState } from 'react'
import Sidebar from './Sidebar'
import { PillTabs } from './ui/pill-tabs'

interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  content?: React.ReactNode
}

interface StatusBadge {
  label: string
  variant: 'success' | 'warning' | 'error' | 'info' | 'default'
}

interface DetailLayoutProps {
  title: string
  subtitle?: string
  status?: React.ReactNode | StatusBadge[]
  actions?: React.ReactNode
  tabs: TabItem[]
  defaultTab?: string
  activeTab?: string
  onTabChange?: (tabId: string) => void
  children?: React.ReactNode // Content for controlled mode, or content above tabs for uncontrolled
  loading?: boolean
  error?: string | null
  onBack?: () => void
}

const variantStyles: Record<StatusBadge['variant'], string> = {
  success: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  warning: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  error: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  info: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  default: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
}

export default function DetailLayout({
  title,
  subtitle,
  status,
  actions,
  tabs,
  defaultTab,
  activeTab,
  onTabChange,
  children,
  loading,
  error,
  onBack
}: DetailLayoutProps) {
  // Support both controlled and uncontrolled modes
  const [internalActiveTab, setInternalActiveTab] = useState(defaultTab || tabs[0]?.id)
  const isControlled = activeTab !== undefined && onTabChange !== undefined
  const currentTab = isControlled ? activeTab : internalActiveTab
  const handleTabChange = isControlled ? onTabChange : setInternalActiveTab

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full flex items-center justify-center p-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 dark:border-primary-800 border-t-purple-600 dark:border-t-purple-400 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Laddar...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
        <Sidebar />
        <main className="flex-1 w-full flex items-center justify-center p-10">
          <div className="text-center max-w-md">
            <p className="text-red-600 dark:text-red-400 text-lg mb-4">{error}</p>
            {onBack && (
              <button
                onClick={onBack}
                className="bg-primary-500 hover:bg-primary-600 text-gray-900 px-6 py-3 rounded-[8px] font-bold shadow-md hover:shadow-xl transition-all"
              >
                Tillbaka
              </button>
            )}
          </div>
        </main>
      </div>
    )
  }

  // In controlled mode, children is the tab content; in uncontrolled mode, use tab.content
  const activeTabContent = isControlled ? children : tabs.find(t => t.id === currentTab)?.content

  // Render status badges
  const renderStatus = () => {
    if (!status) return null
    
    // If status is an array of StatusBadge objects
    if (Array.isArray(status)) {
      return (
        <div className="flex flex-wrap gap-2">
          {(status as StatusBadge[]).map((badge, idx) => (
            <span
              key={idx}
              className={`px-3 py-1 text-xs font-semibold rounded-full ${variantStyles[badge.variant]}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )
    }
    
    // Otherwise render as ReactNode
    return status
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            {onBack && (
              <button
                onClick={onBack}
                className="mb-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 transition-colors"
              >
                ← Tillbaka
              </button>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3 mb-1 sm:mb-2">
                  <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h1>
                  {renderStatus()}
                </div>
                {subtitle && (
                  <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
              
              {actions && (
                <div className="flex flex-wrap gap-3">
                  {actions}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="mb-6">
              <PillTabs
                tabs={tabs.map(({ id, label, icon }) => ({ id, label, icon }))}
                activeTab={currentTab}
                onChange={handleTabChange}
              />
            </div>
          )}

          {/* Tab Content */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTabContent}
          </div>
        </div>
      </main>
    </div>
  )
}
