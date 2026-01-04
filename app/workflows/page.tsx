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
import { Button } from '@/components/ui/button';
import supabase from '@/utils/supabase/supabaseClient';

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
   <div className="min-h-screen flex items-center justify-center">
    <p>Laddar...</p>
   </div>
  );
 }

 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
   <Sidebar />
   <main className="flex-1 p-6 lg:p-8">
    <WorkflowNotifications />
    <div className="max-w-6xl mx-auto space-y-6">
     <div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
       Arbetsflöden
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
       Översikt över aktiva och slutförda arbetsflöden
      </p>
     </div>

     {/* Tabs */}
     <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
      <Button
       variant={activeTab === 'active' ? 'default' : 'ghost'}
       onClick={() => setActiveTab('active')}
       className="rounded-b-none"
      >
       Aktiva
      </Button>
      <Button
       variant={activeTab === 'history' ? 'default' : 'ghost'}
       onClick={() => setActiveTab('history')}
       className="rounded-b-none"
      >
       Historik
      </Button>
     </div>

     {/* Content */}
     {activeTab === 'active' && <LiveUpdatesDashboard userId={userId} />}
     {activeTab === 'history' && <WorkflowHistory userId={userId} />}
    </div>
   </main>
  </div>
 );
}

