// app/components/forms/FormSection.tsx
import React from 'react'

interface FormSectionProps {
 title?: string
 description?: string
 children: React.ReactNode
 className?: string
}

export function FormSection({ title, description, children, className = '' }: FormSectionProps) {
 return (
  <div className={`space-y-4 ${className}`}>
   {(title || description) && (
    <div className="mb-4">
     {title && (
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
       {title}
      </h3>
     )}
     {description && (
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
       {description}
      </p>
     )}
    </div>
   )}
   {children}
  </div>
 )
}

