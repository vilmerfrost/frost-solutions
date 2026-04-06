export function PageSkeleton() {
 return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
   {/* Sidebar skeleton */}
   <aside className="hidden lg:flex w-64 flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
    <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-8 animate-pulse" />
    <div className="space-y-3">
     {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="h-9 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
     ))}
    </div>
   </aside>

   {/* Main content skeleton */}
   <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
    <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
     {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-24 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 animate-pulse" />
     ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
     <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
       <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
      ))}
     </div>
    </div>
   </main>
  </div>
 )
}
