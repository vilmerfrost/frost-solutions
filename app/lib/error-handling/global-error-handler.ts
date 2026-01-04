// app/lib/error-handling/global-error-handler.ts
/**
 * Global error handler to prevent crashes from breaking the whole site
 * This should be initialized early in the app lifecycle
 */

export function initializeGlobalErrorHandlers() {
 if (typeof window === 'undefined') {
  return // Server-side, skip
 }

 // Handle unhandled promise rejections
 window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  
  // Prevent default browser error handling
  event.preventDefault()
  
  // Log to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
   // Example: Sentry.captureException(event.reason)
  }
  
  // Show user-friendly error (optional - can be too noisy)
  // Only show for critical errors
  if (event.reason?.message?.includes('NetworkError') || 
    event.reason?.message?.includes('Failed to fetch')) {
   // Network errors are usually transient, don't show to user
   return
  }
 })

 // Handle general JavaScript errors
 window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  
  // Prevent default browser error handling
  event.preventDefault()
  
  // Log to error tracking service in production
  if (process.env.NODE_ENV === 'production') {
   // Example: Sentry.captureException(event.error)
  }
 })
}

