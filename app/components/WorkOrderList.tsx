// app/components/WorkOrderList.tsx

'use client';

import { useState } from 'react';
import type { WorkOrderStatus, WorkOrderFilters } from '@/types/work-orders';
import { useWorkOrders } from '@/hooks/useWorkOrders';
import { WorkOrderCard, WorkOrderCardSkeleton } from './WorkOrderCard';
import { Plus } from 'lucide-react';
import { WorkOrderModal } from './WorkOrderModal';

// Statusar för flikarna
const TABS: { label: string; status: WorkOrderStatus | 'all' }[] = [
 { label: 'Alla', status: 'all' },
 { label: 'Nya', status: 'new' },
 { label: 'Tilldelade', status: 'assigned' },
 { label: 'Pågående', status: 'in_progress' },
 { label: 'Väntar', status: 'awaiting_approval' },
];

export function WorkOrderList() {
 const [activeTab, setActiveTab] = useState<WorkOrderStatus | 'all'>('all');
 const [filters, setFilters] = useState<WorkOrderFilters>({});
 const [isModalOpen, setIsModalOpen] = useState(false);

 // Kombinera filter från flikar och andra filter
 const combinedFilters: WorkOrderFilters = {
  ...filters,
  status: activeTab === 'all' ? undefined : activeTab,
 };

 const { data: workOrders, isLoading, isError } = useWorkOrders(combinedFilters);

 const handleTabClick = (status: WorkOrderStatus | 'all') => {
  setActiveTab(status);
 };

 return (
  <div className="w-full">
   <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
    {/* Filter Tabs */}
    <div className="flex space-x-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-x-auto">
     {TABS.map((tab) => (
      <button
       key={tab.status}
       onClick={() => handleTabClick(tab.status)}
       className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap min-h-[44px]
        ${activeTab === tab.status
         ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm'
         : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
       `}
      >
       {tab.label}
      </button>
     ))}
    </div>
    
    {/* Create Button */}
    <button
     onClick={() => setIsModalOpen(true)}
     className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 min-h-[44px] w-full sm:w-auto"
    >
     <Plus className="w-5 h-5" />
     <span>Skapa Arbetsorder</span>
    </button>
   </div>
   
   {/* List Content */}
   <div className="mt-6">
    {isLoading && (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array(6).fill(0).map((_, i) => <WorkOrderCardSkeleton key={i} />)}
     </div>
    )}
    
    {isError && (
     <div className="text-center text-red-500">
      Kunde inte ladda arbetsordrar.
     </div>
    )}
    
    {!isLoading && !isError && workOrders && workOrders.length > 0 && (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {workOrders.map((wo) => <WorkOrderCard key={wo.id} workOrder={wo} />)}
     </div>
    )}
    
    {!isLoading && !isError && (!workOrders || workOrders.length === 0) && (
     <div className="text-center text-gray-500 dark:text-gray-400 py-16">
      <h3 className="text-xl font-semibold">Inga arbetsordrar</h3>
      <p className="mt-2">Det finns inga arbetsordrar som matchar dina filter.</p>
     </div>
    )}
   </div>
   
   {/* Modal för att skapa */}
   <WorkOrderModal 
    isOpen={isModalOpen} 
    onClose={() => setIsModalOpen(false)} 
   />
  </div>
 );
}
