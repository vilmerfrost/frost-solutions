import React from 'react';

interface AICardProps {
 children: React.ReactNode;
 className?: string;
 variant?: 'default' | 'green' | 'yellow' | 'red';
}

const variants = {
 default:
  'bg-blue-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
 green:
  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
 yellow:
  'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
 red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

export function AICard({ children, className = '', variant = 'default' }: AICardProps) {
 return (
  <div className={`rounded-[8px] p-4 sm:p-6 border ${variants[variant]} ${className}`}>
   {children}
  </div>
 );
}

