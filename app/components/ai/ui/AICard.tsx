import React from 'react';

interface AICardProps {
 children: React.ReactNode;
 className?: string;
 variant?: 'default' | 'green' | 'yellow' | 'red';
}

const variants = {
 default:
  ' dark:/20 dark:/20 border-primary-200 dark:border-primary-800',
 green:
  'from-green-50  dark:/20 border-green-200 dark:border-green-800',
 yellow:
  'from-amber-50 to-yellow-50  border-amber-200 dark:border-amber-800',
 red: 'from-red-50 to-rose-50  border-red-200 dark:border-red-800',
};

export function AICard({ children, className = '', variant = 'default' }: AICardProps) {
 return (
  <div className={`rounded-[8px] p-4 sm:p-6 border ${variants[variant]} ${className}`}>
   {children}
  </div>
 );
}

