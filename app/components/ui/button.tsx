// app/components/ui/button.tsx
'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
 size?: 'sm' | 'md' | 'lg'
 loading?: boolean
 icon?: React.ReactNode
 iconPosition?: 'left' | 'right'
 children: React.ReactNode
}

export function Button({ 
 variant = 'primary', 
 size = 'md', 
 loading = false,
 icon,
 iconPosition = 'left',
 className = '', 
 children,
 disabled,
 ...props 
}: ButtonProps) {
 const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
 
 const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 border-transparent shadow-sm hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98]',
  secondary: 'border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300 dark:hover:border-gray-500 focus:ring-primary-500 active:scale-[0.98]',
  ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500 active:scale-[0.98] border-transparent',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border-transparent shadow-sm hover:shadow-md hover:-translate-y-[1px] active:scale-[0.98]'
 }
 
 const sizes = {
  sm: 'px-3 py-1.5 text-sm h-[36px] rounded-[6px]',
  md: 'px-5 py-2.5 text-base h-[40px] rounded-[6px]',
  lg: 'px-6 py-3 text-lg h-[48px] rounded-[6px]'
 }

 const isDisabled = disabled || loading

 return (
  <button
   className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
   disabled={isDisabled}
   {...props}
  >
   {loading && <Loader2 className="w-4 h-4 animate-spin" />}
   {!loading && icon && iconPosition === 'left' && icon}
   {children}
   {!loading && icon && iconPosition === 'right' && icon}
  </button>
 )
}

