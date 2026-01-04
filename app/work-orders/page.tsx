// app/work-orders/page.tsx

import { WorkOrderList } from '@/components/WorkOrderList';
import Sidebar from '@/components/Sidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
 title: 'Arbetsordrar | Frost Solutions',
 description: 'Hantera alla arbetsordrar.',
};

// Detta är en Server Component
export default function WorkOrdersPage() {
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row">
   <Sidebar />
   <main className="flex-1 w-full lg:ml-0 overflow-x-hidden">
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto w-full">
     <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white mb-6">
      Arbetsordrar
     </h1>
     
     {/* WorkOrderList är en Client Component som hanterar all sin egen state */}
     <WorkOrderList />
    </div>
   </main>
  </div>
 );
}

