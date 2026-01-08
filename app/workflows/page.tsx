// app/workflows/page.tsx

/**
 * Workflows Page
 * Main page for workflow management and monitoring
 */

'use client';

import { useState, useEffect } from 'react';
import { LiveUpdatesDashboard } from '@/components/workflows/LiveUpdatesDashboard';
import { WorkflowHistory } from '@/components/workflows/WorkflowHistory';
import { WorkflowNotifications } from '@/components/workflows/WorkflowNotifications';
import { useTenant } from '@/context/TenantContext';
import Sidebar from '@/components/SidebarClient';
import supabase from '@/utils/supabase/supabaseClient';
import { Activity, History, Zap, RefreshCw, CheckCircle, Clock } from 'lucide-react';

type Tab = 'active' | 'history';

export default function WorkflowsPage() {
 const { tenantId } = useTenant();
 const [userId, setUserId] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<Tab>('active');

 useEffect(() => {
  async function getUserId() {
   const { data: { user } } = await supabase.auth.getUser();
   if (user) {
    setUserId(user.id);
   }
  }
  getUserId();
 }, []);

 if (!tenantId || !userId) {
  return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
     <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
     <p className="text-gray-600 dark:text-gray-400">Laddar...</p>
    </div>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <WorkflowNotifications />
    
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* Header Section */}
     <div className="mb-8">
      <div className="flex items-center gap-3 mb-3">
       <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
        <Activity className="w-7 h-7 text-primary-600 dark:text-primary-400" />
       </div>
       <div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
         Arbetsflöden
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
         Översikt över aktiva och slutförda arbetsflöden
        </p>
       </div>
      </div>
     </div>

     {/* Stats Cards */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
       <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
       </div>
       <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">AI-driven</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Automatisering</p>
       </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
       <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
       </div>
       <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">Realtid</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Live uppdateringar</p>
       </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
       <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
        <RefreshCw className="w-5 h-5 text-amber-600 dark:text-amber-400" />
       </div>
       <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">Spårning</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Fullständig historik</p>
       </div>
      </div>
     </div>

     {/* Tab Navigation */}
     <div className="mb-6">
      <div className="inline-flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1 gap-1">
       <button
        onClick={() => setActiveTab('active')}
        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
         activeTab === 'active'
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
       >
        <Clock className="w-4 h-4" />
        Aktiva
       </button>
       <button
        onClick={() => setActiveTab('history')}
        className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
         activeTab === 'history'
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }`}
       >
        <History className="w-4 h-4" />
        Historik
       </button>
      </div>
     </div>

     {/* Content Area */}
     <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className={`p-1 ${activeTab === 'active' ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-gray-600 to-gray-700'}`}>
       <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
         {activeTab === 'active' ? (
          <>
           <Clock className="w-5 h-5 text-white" />
           <h2 className="font-semibold text-white">Pågående arbetsflöden</h2>
          </>
         ) : (
          <>
           <History className="w-5 h-5 text-white" />
           <h2 className="font-semibold text-white">Slutförda arbetsflöden</h2>
          </>
         )}
        </div>
        {activeTab === 'active' && (
         <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-white/80">Live</span>
         </div>
        )}
       </div>
      </div>
      <div className="p-4 sm:p-6">
       {activeTab === 'active' && <LiveUpdatesDashboard userId={userId} />}
       {activeTab === 'history' && <WorkflowHistory userId={userId} />}
      </div>
     </div>

     {/* Help Section */}
     <div className="mt-8 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Om arbetsflöden</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
       Arbetsflöden hanterar automatiskt bakgrundsprocesser som OCR-bearbetning, AI-analyser och datasynkronisering.
       Här kan du se status på pågående uppgifter och granska historik över slutförda processer.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
       <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex-shrink-0">
         <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
         <p className="text-sm font-medium text-gray-900 dark:text-white">Aktiva flöden</p>
         <p className="text-xs text-gray-500 dark:text-gray-400">Visar pågående processer i realtid</p>
        </div>
       </div>
       <div className="flex items-start gap-3">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
         <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>
        <div>
         <p className="text-sm font-medium text-gray-900 dark:text-white">Historik</p>
         <p className="text-xs text-gray-500 dark:text-gray-400">Granska slutförda arbetsflöden</p>
        </div>
       </div>
      </div>
     </div>
    </div>
   </main>
  </div>
 );
}
