// app/work-orders/[id]/page.tsx

import { WorkOrderDetail } from '@/components/WorkOrderDetail';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Arbetsorder | Frost Solutions',
 description: 'Visa arbetsorder detaljer.',
};

// Detta är en Server Component
export default async function WorkOrderDetailPage({ 
 params 
}: { 
 params: Promise<{ id: string }> 
}) {
 const { id } = await params;
 
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     {/* WorkOrderDetail är en Client Component som hanterar 
      all sin egen datahämtning, state och interaktivitet 
      baserat på ID:t.
     */}
     <WorkOrderDetail workOrderId={id} />
    </div>
   </main>
  </div>
 );
}
