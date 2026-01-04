'use client'

import { Toaster as SonnerToaster } from 'sonner'

export default function Toaster() {
  return (
    <SonnerToaster 
      position="top-right"
      richColors
      closeButton
      duration={4000}
      toastOptions={{
        style: {
          background: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          border: '1px solid hsl(var(--border))',
          borderRadius: '8px',
          fontSize: '14px',
          padding: '16px',
        },
        className: 'shadow-lg',
        classNames: {
          success: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-success-500',
          error: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-error-500',
          warning: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-yellow-500',
          info: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-primary-500',
        },
      }}
    />
  )
}
