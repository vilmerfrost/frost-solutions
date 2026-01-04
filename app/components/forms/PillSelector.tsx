// app/components/forms/PillSelector.tsx
'use client'

import React from 'react'

interface PillOption {
 value: string
 label: string
}

interface PillSelectorProps {
 label?: string
 options: PillOption[] | string[]
 value: string
 onChange: (value: string) => void
 required?: boolean
}

export function PillSelector({ label, options, value, onChange, required }: PillSelectorProps) {
 // Normalize options to always be array of objects
 const normalizedOptions: PillOption[] = options.map(opt => 
  typeof opt === 'string' ? { value: opt, label: opt } : opt
 )

 return (
  <div className="w-full">
   {label && (
    <label className="block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-3">
     {label}{required && <span className="text-red-500 ml-1">*</span>}
    </label>
   )}
   
   <div className="flex flex-wrap gap-2">
    {normalizedOptions.map((option) => {
     const isSelected = value === option.value
     
     return (
      <button
       key={option.value}
       type="button"
       onClick={() => onChange(option.value)}
       className={`
        px-4 py-2.5 rounded-full font-medium text-sm transition-all duration-150
        ${
         isSelected
          ? 'bg-primary-500 text-white shadow-md'
          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
        }
       `}
      >
       {option.label}
      </button>
     )
    })}
   </div>
  </div>
 )
}

