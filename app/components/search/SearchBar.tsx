'use client';

import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useSearch } from '@/hooks/useSearch';

export function SearchBar() {
  const { query, setQuery, search, isSearching, results } = useSearch();
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-search on debounced query change
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      console.log('🔍 SearchBar: Triggering search for:', debouncedQuery);
      search(debouncedQuery);
    }
  }, [debouncedQuery, search]);

  // Debug logging
  useEffect(() => {
    if (results) {
      console.log('🔍 SearchBar: Results received:', results);
    }
  }, [results]);

  // Return a placeholder that matches the structure to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="relative w-full max-w-2xl mx-auto">
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value=""
            placeholder="Sök projekt, kunder, fakturor..."
            className="w-full pl-12 pr-24 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled
            readOnly
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sök projekt, kunder, fakturor..."
          className="w-full pl-12 pr-24 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-12 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Rensa sökning"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Visa filter"
          type="button"
        >
          <Filter className="w-5 h-5" />
        </button>
      </div>
      
      {/* TODO: Implement Filter UI when showFilters is true */}

      {/* Loading & Results Dropdown */}
      {query.length >= 2 && (
         <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-[9999]">
           {isSearching ? (
             <div className="flex items-center gap-2 p-4 text-gray-600 dark:text-gray-400">
               <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
               <span>Söker...</span>
             </div>
           ) : results && (results.projects || results.clients || results.invoices) ? (
             <>
               {/* Projects */}
               {results.projects && results.projects.length > 0 && (
                 <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                   <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                     Projekt ({results.projects.length})
                   </h3>
                   <div className="space-y-2">
                     {results.projects.map((project) => (
                       <a
                         key={project.id}
                         href={`/projects/${project.id}`}
                         className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                       >
                         <div className="font-medium text-gray-900 dark:text-white">
                           {project.name}
                         </div>
                         <div className="text-xs text-gray-500 dark:text-gray-400">
                           Status: {project.status}
                         </div>
                       </a>
                     ))}
                   </div>
                 </div>
               )}

               {/* Clients */}
               {results.clients && results.clients.length > 0 && (
                 <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                   <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                     Kunder ({results.clients.length})
                   </h3>
                   <div className="space-y-2">
                     {results.clients.map((client) => (
                       <a
                         key={client.id}
                         href={`/clients/${client.id}`}
                         className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                       >
                         <div className="font-medium text-gray-900 dark:text-white">
                           {client.name}
                         </div>
                         {client.org_number && (
                           <div className="text-xs text-gray-500 dark:text-gray-400">
                             Org.nr: {client.org_number}
                           </div>
                         )}
                       </a>
                     ))}
                   </div>
                 </div>
               )}

               {/* Invoices */}
               {results.invoices && results.invoices.length > 0 && (
                 <div className="p-4">
                   <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2">
                     Fakturor ({results.invoices.length})
                   </h3>
                   <div className="space-y-2">
                     {results.invoices.map((invoice) => (
                       <a
                         key={invoice.id}
                         href={`/invoices/${invoice.id}`}
                         className="block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                       >
                         <div className="font-medium text-gray-900 dark:text-white">
                           {invoice.number || invoice.id.slice(0, 8)} - {invoice.customer_name}
                         </div>
                         <div className="text-xs text-gray-500 dark:text-gray-400">
                           {Number(invoice.amount || 0).toLocaleString('sv-SE')} kr
                         </div>
                       </a>
                     ))}
                   </div>
                 </div>
               )}

               {/* No Results */}
               {(!results.projects || results.projects.length === 0) &&
                 (!results.clients || results.clients.length === 0) &&
                 (!results.invoices || results.invoices.length === 0) && (
                   <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                     Inga resultat hittades för &quot;{query}&quot;
                   </div>
                 )}
             </>
           ) : !isSearching && (
             <div className="p-8 text-center text-gray-500 dark:text-gray-400">
               Inga resultat hittades för &quot;{query}&quot;
             </div>
           )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;

