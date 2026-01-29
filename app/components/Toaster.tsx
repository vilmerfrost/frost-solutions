'use client'

import { Toaster as SonnerToaster } from 'sonner'

/**
 * Accessible toast notification container.
 * Uses ARIA live regions to announce notifications to screen readers.
 */
export default function Toaster() {
  return (
    <>
      {/* ARIA live region for screen reader announcements */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {/* Toast messages will be announced automatically by Sonner */}
      </div>
      
      <SonnerToaster 
        position="top-right"
        richColors
        closeButton
        duration={4000}
        // Accessibility configuration
        visibleToasts={5}
        expand={false}
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
          // Ensure toasts are accessible
          descriptionClassName: 'text-gray-600 dark:text-gray-400',
        }}
      />
    </>
  )
}
