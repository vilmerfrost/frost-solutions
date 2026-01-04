import React from 'react'

interface IconBadgeProps {
 icon: React.ReactNode
 color?: 'yellow' | 'blue' | 'green' | 'red'
 size?: 'sm' | 'md' | 'lg'
 className?: string
}

export function IconBadge({ icon, color = 'yellow', size = 'md', className = '' }: IconBadgeProps) {
 const colors = {
  yellow: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  blue: 'bg-primary-50 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400',
  green: 'bg-success-50 dark:bg-success-500/20 text-success-600 dark:text-success-400',
  red: 'bg-error-50 dark:bg-error-500/20 text-error-600 dark:text-error-400',
 }
 
 const sizes = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
 }
 
 return (
  <div className={`${sizes[size]} rounded-lg ${colors[color]} flex items-center justify-center ${className}`}>
   {icon}
  </div>
 )
}

