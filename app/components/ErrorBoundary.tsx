'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import * as Sentry from '@sentry/nextjs'
import { BASE_PATH } from '@/utils/url'

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
   const errorMessage = this.state.error?.message || 'Okänt fel'
   const errorStack = this.state.error?.stack || ''
   const feedbackUrl = `${BASE_PATH}/feedback?type=bug&subject=${encodeURIComponent(`${featureConfig.title}: ${errorMessage.substring(0, 50)}`)}&message=${encodeURIComponent(
    `Bugg i ${feature}!\n\n` +
    `Felmeddelande: ${errorMessage}\n\n` +
    `Sida: ${window.location.href}\n` +
    `Tidpunkt: ${new Date().toISOString()}\n\n` +
    `Stack trace:\n${errorStack.substring(0, 500)}`
   )}`

   return (
    <div className="min-h-[320px] bg-gradient-to-br from-stone-50 via-amber-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 flex items-center justify-center p-6">
     <div className="max-w-2xl w-full overflow-hidden rounded-[24px] border border-stone-200/80 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 shadow-[0_20px_60px_rgba(28,25,23,0.18)]" role="alert">
      <div className="flex h-3 w-full overflow-hidden">
       {Array.from({ length: 16 }).map((_, i) => (
        <div
         key={i}
         className={i % 2 === 0 ? 'flex-1 bg-primary-500' : 'flex-1 bg-stone-900 dark:bg-stone-700'}
        />
       ))}
      </div>

      <div className="grid gap-6 p-6 sm:p-8 md:grid-cols-[1.2fr_0.8fr]">
       <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
         Arbetsstopp
        </div>

        <div className="flex items-start gap-4">
         <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[18px] bg-stone-900 text-3xl shadow-lg dark:bg-stone-800">
          {featureConfig.icon}
         </div>
         <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50 sm:text-3xl">
           {featureConfig.title}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-300 sm:text-base">
           {featureConfig.description}
          </p>
         </div>
        </div>

        <div className="rounded-[18px] border border-stone-200 bg-stone-50/80 p-4 dark:border-stone-800 dark:bg-stone-950/60">
         <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Vi har spärrat arbetsområdet tills du väljer nästa steg.
         </p>
         <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Du kan prova igen direkt eller skicka in en färdig felrapport med sidan och felmeddelandet förifyllt.
         </p>
        </div>

        {this.state.error && process.env.NODE_ENV === 'development' && (
         <details className="rounded-[18px] border border-dashed border-stone-300 bg-white/80 p-4 text-left dark:border-stone-700 dark:bg-stone-950/50">
          <summary className="cursor-pointer text-sm font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100">
           Teknisk information
          </summary>
          <pre className="mt-3 max-h-48 overflow-auto rounded-xl bg-stone-950 p-4 text-xs text-stone-100">
           {this.state.error.toString()}
          </pre>
         </details>
        )}
       </div>

       <div className="flex flex-col justify-between gap-4 rounded-[20px] border border-stone-200 bg-[linear-gradient(180deg,rgba(245,158,11,0.14),rgba(255,255,255,0.55))] p-5 dark:border-stone-800 dark:bg-[linear-gradient(180deg,rgba(245,158,11,0.16),rgba(28,25,23,0.55))]">
        <div>
         <p className="text-xs font-bold uppercase tracking-[0.24em] text-stone-500 dark:text-stone-400">
          Snabbåtgärder
         </p>
         <div className="mt-4 space-y-3">
          <button
           onClick={this.handleRetry}
           className="flex w-full items-center justify-center gap-2 rounded-[14px] bg-primary-500 px-4 py-3 font-bold text-stone-950 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-600 hover:shadow-md"
           aria-label={canRetry ? 'Försök igen' : 'Ladda om sidan'}
          >
           <span>🔄</span>
           <span>{canRetry ? `Försök igen (${MAX_RETRIES - this.state.retryCount} kvar)` : 'Ladda om sidan'}</span>
          </button>
          {showReportButton && (
           <button
            onClick={() => {
             window.location.href = feedbackUrl
            }}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] border border-stone-300 bg-white px-4 py-3 font-semibold text-stone-800 transition-all hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100 dark:hover:bg-stone-900"
            aria-label="Rapportera bugg"
           >
            <span>🐛</span>
            <span>Rapportera felet</span>
           </button>
          )}
         </div>
        </div>

        <div className="rounded-[16px] border border-stone-200/80 bg-white/80 p-4 dark:border-stone-800 dark:bg-stone-950/60">
         <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
          Tips
         </p>
         <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Om samma fel kommer tillbaka flera gånger vill vi helst ha felrapporten. Den innehåller redan det viktigaste vi behöver.
         </p>
        </div>
       </div>
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

