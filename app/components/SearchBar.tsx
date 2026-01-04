'use client'

import { useState, useEffect } from 'react'

interface SearchBarProps {
 placeholder?: string
 onSearch: (query: string) => void
 debounceMs?: number
 className?: string
}

/**
 * Reusable search bar component with debouncing
 */
export default function SearchBar({ 
 placeholder = 'Sök...', 
 onSearch, 
 debounceMs = 300,
 className = '' 
}: SearchBarProps) {
 const [query, setQuery] = useState('')

 useEffect(() => {
  const timer = setTimeout(() => {
   onSearch(query)
  }, debounceMs)

  return () => clearTimeout(timer)
 }, [query, debounceMs, onSearch])

 return (
  <div className={`relative ${className}`}>
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
   </div>
   <input
    type="text"
    value={query}
    onChange={(e) => setQuery(e.target.value)}
    placeholder={placeholder}
    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[8px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
   />
   {query && (
    <button
     onClick={() => setQuery('')}
     className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
    >
     <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
     </svg>
    </button>
   )}
  </div>
 )
}

