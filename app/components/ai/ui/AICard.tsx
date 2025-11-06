import React from 'react';

interface AICardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'green' | 'yellow' | 'red';
}

const variants = {
  default:
    'from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800',
  green:
    'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800',
  yellow:
    'from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border-amber-200 dark:border-amber-800',
  red: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800',
};

export function AICard({ children, className = '', variant = 'default' }: AICardProps) {
  return (
    <div className={`bg-gradient-to-r rounded-xl p-4 sm:p-6 border ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
}

