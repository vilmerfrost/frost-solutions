// app/components/ui/select.tsx
import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
 label?: string
 error?: string
 children: React.ReactNode
}

export function Select({ label, error, children, className = '', ...props }: SelectProps) {
 const isRequired = props.required

 return (
  <div className="w-full">
   {label && (
    <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-2">
     {label}{isRequired && <span className="text-red-500 ml-1">*</span>}
    </label>
   )}
   <select
    className={`w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-[6px] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-100 dark:focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-150 disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 ${
     error ? 'border-red-500 dark:border-red-600 focus:ring-red-100 focus:border-red-500' : ''
    } ${className}`}
    {...props}
   >
    {children}
   </select>
   {error && (
    <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</p>
   )}
  </div>
 )
}

