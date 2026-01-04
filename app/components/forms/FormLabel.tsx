// app/components/forms/FormLabel.tsx
import React from 'react'

interface FormLabelProps {
 htmlFor?: string
 required?: boolean
 children: React.ReactNode
 className?: string
}

export function FormLabel({ htmlFor, required, children, className = '' }: FormLabelProps) {
 return (
  <label
   htmlFor={htmlFor}
   className={`block text-[14px] font-medium text-gray-700 dark:text-gray-300 mb-2 ${className}`}
  >
   {children}
   {required && <span className="text-red-500 ml-1">*</span>}
  </label>
 )
}

