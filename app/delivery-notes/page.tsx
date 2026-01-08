// app/delivery-notes/page.tsx

/**
 * Delivery Notes Page
 * Main page for OCR delivery note processing
 */

'use client';

import { useState, useEffect } from 'react';
import FileUpload from '@/components/ocr/FileUpload';
import { LiveUpdatesDashboard } from '@/components/workflows/LiveUpdatesDashboard';
import { useTenant } from '@/context/TenantContext';
import Sidebar from '@/components/SidebarClient';
import { WorkflowNotifications } from '@/components/workflows/WorkflowNotifications';
import supabase from '@/utils/supabase/supabaseClient';
import { FileText, Upload, Clock, CheckCircle, AlertCircle, Zap } from 'lucide-react';

export default function DeliveryNotesPage() {
 const { tenantId } = useTenant();
 const [userId, setUserId] = useState<string | null>(null);
 const [refreshKey, setRefreshKey] = useState(0);
 const [recentUploads, setRecentUploads] = useState(0);

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
        <FileText className="w-7 h-7 text-primary-600 dark:text-primary-400" />
       </div>
       <div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
         Följesedlar
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
         Automatisk OCR-bearbetning och materialregistrering
        </p>
       </div>
      </div>
     </div>

     {/* Feature Cards */}
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
       <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
       </div>
       <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">AI-driven OCR</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Automatisk textläsning</p>
       </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
       <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
       </div>
       <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Auto-matchning</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Material & leverantörer</p>
       </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
       <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
        <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
       </div>
       <div>
        <p className="text-sm font-medium text-gray-900 dark:text-white">Realtidsuppdateringar</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">Live status</p>
       </div>
      </div>
     </div>

     {/* Main Content */}
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Upload Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
       <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 sm:p-6">
        <div className="flex items-center gap-3">
         <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <Upload className="w-5 h-5 text-white" />
         </div>
         <div>
          <h2 className="text-lg font-semibold text-white">Ladda upp följesedel</h2>
          <p className="text-sm text-white/80">Dra och släpp eller välj fil</p>
         </div>
        </div>
       </div>
       <div className="p-4 sm:p-6">
        <FileUpload
         docType="delivery-note"
         endpoint="/api/delivery-notes/process"
         maxSizeMB={10}
         onSuccess={() => {
          setRefreshKey((k) => k + 1);
          setRecentUploads((r) => r + 1);
         }}
        />
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
         <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-4 h-4" />
          <span>Stöder PDF, PNG, JPG (max 10 MB)</span>
         </div>
        </div>
       </div>
      </div>

      {/* Status Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
       <div className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 p-4 sm:p-6">
        <div className="flex items-center gap-3">
         <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
          <Clock className="w-5 h-5 text-white" />
         </div>
         <div>
          <h2 className="text-lg font-semibold text-white">Bearbetningsstatus</h2>
          <p className="text-sm text-white/80">Live uppdateringar</p>
         </div>
        </div>
       </div>
       <div className="p-4 sm:p-6">
        <LiveUpdatesDashboard userId={userId} key={refreshKey} />
       </div>
      </div>
     </div>

     {/* Help Section */}
     <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
      <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Hur fungerar det?</h3>
      <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
       <li className="flex items-start gap-2">
        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">1</span>
        <span>Ladda upp en bild eller PDF av följesedeln</span>
       </li>
       <li className="flex items-start gap-2">
        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">2</span>
        <span>AI:n extraherar automatiskt material, mängder och priser</span>
       </li>
       <li className="flex items-start gap-2">
        <span className="flex-shrink-0 w-5 h-5 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center text-xs font-medium">3</span>
        <span>Granska och godkänn för att registrera materialet i systemet</span>
       </li>
      </ol>
     </div>
    </div>
   </main>
  </div>
 );
}
