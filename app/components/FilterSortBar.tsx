'use client'

import { useState } from 'react'

export type SortOption = {
 value: string
 label: string
 direction?: 'asc' | 'desc'
}

export type FilterOption = {
 value: string
 label: string
}

interface FilterSortBarProps {
 sortOptions: SortOption[]
 filterOptions?: {
  label: string
  key: string
  options: FilterOption[]
 }[]
 onSort: (value: string, direction: 'asc' | 'desc') => void
 onFilter: (key: string, value: string) => void
 defaultSort?: string
 defaultFilter?: Record<string, string>
 className?: string
}

/**
 * Reusable filter and sort bar component
 */
export default function FilterSortBar({
 sortOptions,
 filterOptions = [],
 onSort,
 onFilter,
 defaultSort = '',
 defaultFilter = {},
 className = '',
}: FilterSortBarProps) {
 const [sortValue, setSortValue] = useState(defaultSort)
 const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
 const [filters, setFilters] = useState<Record<string, string>>(defaultFilter)

 const handleSortChange = (value: string) => {
  setSortValue(value)
  const option = sortOptions.find(opt => opt.value === value)
  const direction = option?.direction || sortDirection
  setSortDirection(direction)
  onSort(value, direction)
 }

 const handleFilterChange = (key: string, value: string) => {
  const newFilters = { ...filters, [key]: value }
  setFilters(newFilters)
  onFilter(key, value)
 }

 const clearFilters = () => {
  setFilters({})
  setSortValue(defaultSort)
  filterOptions.forEach(filter => {
   onFilter(filter.key, '')
  })
  onSort(defaultSort, 'desc')
 }

 const hasActiveFilters = Object.values(filters).some(v => v !== '') || sortValue !== defaultSort

 return (
  <div className={`flex flex-col sm:flex-row gap-4 items-start sm:items-center ${className}`}>
   {/* Filters */}
   {filterOptions.length > 0 && (
    <div className="flex flex-wrap gap-3 flex-1">
     {filterOptions.map(filter => (
      <select
       key={filter.key}
       value={filters[filter.key] || ''}
       onChange={(e) => handleFilterChange(filter.key, e.target.value)}
       className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
      >
       <option value="">Alla {filter.label}</option>
       {filter.options.map(option => (
        <option key={option.value} value={option.value}>
         {option.label}
        </option>
       ))}
      </select>
     ))}
    </div>
   )}

   {/* Sort */}
   <div className="flex items-center gap-2">
    <label className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Sortera:</label>
    <select
     value={sortValue}
     onChange={(e) => handleSortChange(e.target.value)}
     className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
    >
     {sortOptions.map(option => (
      <option key={option.value} value={option.value}>
       {option.label}
      </option>
     ))}
    </select>
    {sortValue && (
     <button
      onClick={() => {
       const newDirection = sortDirection === 'asc' ? 'desc' : 'asc'
       setSortDirection(newDirection)
       onSort(sortValue, newDirection)
      }}
      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      title={`Sortera ${sortDirection === 'asc' ? 'fallande' : 'stigande'}`}
     >
      {sortDirection === 'asc' ? '↑' : '↓'}
     </button>
    )}
   </div>

   {/* Clear filters */}
   {hasActiveFilters && (
    <button
     onClick={clearFilters}
     className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white underline transition-colors"
    >
     Rensa filter
    </button>
   )}
  </div>
 )
}

