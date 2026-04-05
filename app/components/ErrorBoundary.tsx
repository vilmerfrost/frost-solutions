'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'

// Feature-specific error messages
const FEATURE_MESSAGES: Record<string, { title: string; description: string; icon: string }> = {
 dashboard: {
  title: 'Kontrollpanelen kunde inte laddas',
  description: 'Det gick inte att läsa in kontrollpanelen. Dina data är säkra.',
  icon: '📊',
 },
 invoices: {
  title: 'Faktureringsfel',
  description: 'Det uppstod ett problem med faktureringen. Inga ändringar har sparats.',
  icon: '🧾',
 },
 projects: {
  title: 'Projektfel',
  description: 'Det gick inte att läsa in projektet. Försök igen om en stund.',
  icon: '📁',
 },
 timeTracking: {
  title: 'Tidsrapporteringsfel',
  description: 'Tidsrapporteringen kunde inte laddas. Dina sparade timmar är säkra.',
  icon: '⏱️',
 },
 payroll: {
  title: 'Lönehanteringsfel',
  description: 'Det uppstod ett problem med lönehanteringen. Kontakta support vid behov.',
  icon: '💰',
 },
 default: {
  title: 'Något gick fel',
  description: 'Ett oväntat fel uppstod. Försök ladda om sidan eller kontakta support om problemet kvarstår.',
  icon: '⚠️',
 },
}

interface Props {
 children: ReactNode
 fallback?: ReactNode
 feature?: keyof typeof FEATURE_MESSAGES
 onRetry?: () => void
 showReportButton?: boolean
}

interface State {
 hasError: boolean
 error: Error | null
 retryCount: number
}

const MAX_RETRIES = 3

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
  super(props)
  this.state = { hasError: false, error: null, retryCount: 0 }
 }

 static getDerivedStateFromError(error: Error): Partial<State> {
  return { hasError: true, error }
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  const { feature = 'default' } = this.props
  
  // Log error to console (will be stripped in production)
  console.error('ErrorBoundary caught an error:', error, errorInfo)
  
  // Send to Sentry in production
  if (process.env.NODE_ENV === 'production') {
   Sentry.captureException(error, { 
    contexts: { 
     react: { 
      componentStack: errorInfo.componentStack 
     } 
    },
    tags: { 
     component: 'error-boundary',
     feature,
    }
   })
  }
 }

 handleRetry = () => {
  const { onRetry } = this.props
  const { retryCount } = this.state

  if (retryCount < MAX_RETRIES) {
   this.setState({ 
    hasError: false, 
    error: null, 
    retryCount: retryCount + 1 
   })
   onRetry?.()
  } else {
   window.location.reload()
  }
 }

 render() {
  const { feature = 'default', showReportButton = true } = this.props
  const featureConfig = FEATURE_MESSAGES[feature] || FEATURE_MESSAGES.default

  if (this.state.hasError) {
   if (this.props.fallback) {
    return this.props.fallback
   }

   const canRetry = this.state.retryCount < MAX_RETRIES

   return (
    <div className="min-h-[300px] bg-white dark:bg-gray-800 flex items-center justify-center p-6">
     <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-[8px] shadow-md border border-red-200 dark:border-red-800 p-8 text-center" role="alert">
      <div className="text-6xl mb-4">{featureConfig.icon}</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{featureConfig.title}</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
       {featureConfig.description}
      </p>
      {this.state.error && process.env.NODE_ENV === 'development' && (
       <details className="mt-4 text-left">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
         Teknisk information (endast i utvecklingsläge)
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded text-xs overflow-auto max-h-40">
         {this.state.error.toString()}
        </pre>
       </details>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
       <button
        onClick={this.handleRetry}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-gray-900 font-bold py-2 px-6 rounded-[8px] hover:shadow-md transition-all min-h-[44px]"
        aria-label={canRetry ? 'Försök igen' : 'Ladda om sidan'}
       >
        🔄 {canRetry ? `Försök igen (${MAX_RETRIES - this.state.retryCount} kvar)` : 'Ladda om sidan'}
       </button>
       {showReportButton && (
        <button
         onClick={() => {
          const errorMessage = this.state.error?.message || 'Okänt fel'
          const errorStack = this.state.error?.stack || ''
          const feedbackUrl = `/feedback?type=bug&subject=${encodeURIComponent(`${featureConfig.title}: ${errorMessage.substring(0, 50)}`)}&message=${encodeURIComponent(
           `Bugg i ${feature}!\n\n` +
           `Felmeddelande: ${errorMessage}\n\n` +
           `Sida: ${window.location.href}\n` +
           `Tidpunkt: ${new Date().toISOString()}\n\n` +
           `Stack trace:\n${errorStack.substring(0, 500)}`
          )}`
          window.location.href = feedbackUrl
         }}
         className="flex-1 bg-red-500 text-white font-bold py-2 px-6 rounded-[8px] hover:bg-red-600 hover:shadow-md transition-all min-h-[44px]"
         aria-label="Rapportera bugg"
        >
         🐛 Rapportera bugg
        </button>
       )}
      </div>
     </div>
    </div>
   )
  }

  return this.props.children
 }
}

// Pre-configured error boundaries for specific features
export function DashboardErrorBoundary({ children }: { children: ReactNode }) {
 return <ErrorBoundary feature="dashboard">{children}</ErrorBoundary>
}

export function InvoiceErrorBoundary({ children }: { children: ReactNode }) {
 return <ErrorBoundary feature="invoices">{children}</ErrorBoundary>
}

export function ProjectErrorBoundary({ children }: { children: ReactNode }) {
 return <ErrorBoundary feature="projects">{children}</ErrorBoundary>
}

export function TimeTrackingErrorBoundary({ children }: { children: ReactNode }) {
 return <ErrorBoundary feature="timeTracking">{children}</ErrorBoundary>
}

export function PayrollErrorBoundary({ children }: { children: ReactNode }) {
 return <ErrorBoundary feature="payroll">{children}</ErrorBoundary>
}

