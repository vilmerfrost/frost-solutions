// app/components/integrations/ExportButtons.tsx
"use client";

import { useExportToFortnox } from '@/hooks/useIntegrations';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';

export function ExportButtons({ integrationId }: { integrationId: string }) {
 const exportMutation = useExportToFortnox();
 const [loading, setLoading] = useState<'customers' | 'invoices' | null>(null);

 const handleExport = async (type: 'customer' | 'invoice') => {
  // För bulk export, använd 'all' som ID
  // Backend kan hantera detta eller vi kan skapa en separat endpoint
  const dummyId = 'all'; 
  
  setLoading(type);
  try {
   await exportMutation.mutateAsync({
    integrationId,
    type: type,
    id: dummyId, 
   });
  } finally {
   setLoading(null);
  }
 };

 return (
  <div className="bg-gray-50 dark:bg-gray-900 rounded-[8px] shadow-md p-6">
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Exportera Kunder */}
    <button
     onClick={() => handleExport('customer')}
     disabled={loading === 'customers' || exportMutation.isPending}
     className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 min-h-[44px] disabled:opacity-70 disabled:cursor-not-allowed"
    >
     {loading === 'customers' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
     <span>Exportera alla Kunder</span>
    </button>

    {/* Exportera Fakturor */}
    <button
     onClick={() => handleExport('invoice')}
     disabled={loading === 'invoices' || exportMutation.isPending}
     className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg shadow-sm hover:bg-blue-700 min-h-[44px] disabled:opacity-70 disabled:cursor-not-allowed"
    >
     {loading === 'invoices' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
     <span>Exportera alla Fakturor</span>
    </button>
   </div>
   <p className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
    Detta köar ett jobb för att exportera alla poster som inte redan synkroniserats.
   </p>
  </div>
 );
}

