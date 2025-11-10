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

export default function DeliveryNotesPage() {
  const { tenantId } = useTenant();
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <WorkflowNotifications />
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Följesedlar
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Ladda upp följesedlar för automatisk OCR-bearbetning och materialregistrering
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <FileUpload
                docType="delivery-note"
                endpoint="/api/delivery-notes/process"
                maxSizeMB={10}
                onSuccess={() => {
                  setRefreshKey((k) => k + 1);
                }}
              />
            </div>
            <div>
              <LiveUpdatesDashboard userId={userId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

