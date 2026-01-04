// app/components/ui/accessible-button.tsx

/**
 * Accessible Button Component
 * Based on Claude implementation with WCAG 2.1 AA compliance
 */

'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 children: React.ReactNode;
 variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
 size?: 'sm' | 'md' | 'lg';
 isLoading?: boolean;
 loadingText?: string;
 leftIcon?: React.ReactNode;
 rightIcon?: React.ReactNode;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
 (
  {
   children,
   variant = 'primary',
   size = 'md',
   isLoading = false,
   loadingText,
   leftIcon,
   rightIcon,
   className,
   disabled,
   type = 'button',
   ...props
  },
  ref
 ) => {
  const variants = {
   primary:
    'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600',
   secondary:
    'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white',
   danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
   ghost:
    'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500 dark:hover:bg-gray-800 dark:text-gray-300',
  };

  const sizes = {
   sm: 'px-3 py-1.5 text-sm min-h-[36px]',
   md: 'px-4 py-2 text-base min-h-[44px]', // WCAG touch target
   lg: 'px-6 py-3 text-lg min-h-[48px]',
  };

  return (
   <button
    ref={ref}
    type={type}
    disabled={disabled || isLoading}
    className={cn(
     // Base styles
     'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
     'transition-all duration-200 ease-in-out',
     // Focus styles (WCAG compliance)
     'focus:outline-none focus:ring-2 focus:ring-offset-2',
     'focus-visible:ring-2 focus-visible:ring-offset-2',
     // Disabled styles
     'disabled:opacity-50 disabled:cursor-not-allowed',
     // Variant and size
     variants[variant],
     sizes[size],
     className
    )}
    aria-busy={isLoading}
    aria-disabled={disabled || isLoading}
    {...props}
   >
    {isLoading ? (
     <>
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <span>{loadingText || children}</span>
     </>
    ) : (
     <>
      {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
      {children}
      {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
     </>
    )}
   </button>
  );
 }
);

AccessibleButton.displayName = 'AccessibleButton';

export { AccessibleButton };

