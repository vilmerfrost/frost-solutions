// app/components/ui/select.tsx
import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, children, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        className={`w-full px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:focus:ring-emerald-600 dark:focus:border-emerald-600 transition-all duration-200 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed ${
          error ? 'border-red-500 dark:border-red-600 focus:ring-red-500 focus:border-red-500' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
      )}
    </div>
  )
}

