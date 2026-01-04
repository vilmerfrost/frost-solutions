// app/components/forms/CalculationBox.tsx
import React from 'react'

interface CalculationBoxProps {
 title?: string
 items: {
  label: string
  value: string | number
  highlight?: boolean
  icon?: string
 }[]
 footer?: string
 className?: string
}

export function CalculationBox({ title, items, footer, className = '' }: CalculationBoxProps) {
 return (
  <div className={`bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-700 rounded-lg p-5 ${className}`}>
   {title && (
    <h4 className="text-base font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center gap-2">
     {title}
    </h4>
   )}
   
   <div className="space-y-2">
    {items.map((item, index) => (
     <div
      key={index}
      className={`flex items-center justify-between ${
       item.highlight
        ? 'text-yellow-900 dark:text-yellow-100 font-semibold text-lg pt-2 mt-2 border-t-2 border-yellow-300 dark:border-yellow-600'
        : 'text-yellow-800 dark:text-yellow-200'
      }`}
     >
      <span className="flex items-center gap-2">
       {item.icon && <span className="text-lg">{item.icon}</span>}
       {item.label}
      </span>
      <span className={item.highlight ? 'font-bold' : 'font-medium'}>
       {item.value}
      </span>
     </div>
    ))}
   </div>
   
   {footer && (
    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
     {footer}
    </p>
   )}
  </div>
 )
}

