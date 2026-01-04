'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { ScheduleCalendar } from '@/components/scheduling/ScheduleCalendar'
import { AbsenceCalendar } from '@/components/scheduling/AbsenceCalendar'

export default function CalendarPage() {
 const [activeTab, setActiveTab] = useState<'schedule' | 'absence'>('schedule')

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* Header */}
     <div className="mb-6 sm:mb-8">
      <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">
       Schema/Kalender
      </h1>
      <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
       Hantera scheman och frånvaro
      </p>
     </div>

     {/* Tabs */}
     <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
      <nav className="flex space-x-4">
       <button
        onClick={() => setActiveTab('schedule')}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
         activeTab === 'schedule'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
       >
        Schema
       </button>
       <button
        onClick={() => setActiveTab('absence')}
        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
         activeTab === 'absence'
          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
       >
        Frånvaro
       </button>
      </nav>
     </div>

     {/* Content */}
     {activeTab === 'schedule' ? (
      <ScheduleCalendar />
     ) : (
      <AbsenceCalendar />
     )}
    </div>
   </main>
  </div>
 )
}

