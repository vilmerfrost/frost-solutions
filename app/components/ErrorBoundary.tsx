'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
 children: ReactNode
 fallback?: ReactNode
}

interface State {
 hasError: boolean
 error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
  super(props)
  this.state = { hasError: false, error: null }
 }

 static getDerivedStateFromError(error: Error): State {
  return { hasError: true, error }
 }

 componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  // Log error to console (in production, send to error tracking service)
  console.error('ErrorBoundary caught an error:', error, errorInfo)
  
  // In production, you could send this to an error tracking service like Sentry
  if (process.env.NODE_ENV === 'production') {
   // Example: Sentry.captureException(error, { contexts: { react: errorInfo } })
  }
 }

 render() {
  if (this.state.hasError) {
   if (this.props.fallback) {
    return this.props.fallback
   }

   return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
     <div className="max-w-md w-full bg-white rounded-[8px] shadow-md border border-red-200 p-8 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Något gick fel</h1>
      <p className="text-gray-600 mb-6">
       Ett oväntat fel uppstod. Försök ladda om sidan eller kontakta support om problemet kvarstår.
      </p>
      {this.state.error && process.env.NODE_ENV === 'development' && (
       <details className="mt-4 text-left">
        <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
         Teknisk information (endast i utvecklingsläge)
        </summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
         {this.state.error.toString()}
        </pre>
       </details>
      )}
      <div className="flex flex-col sm:flex-row gap-3 mt-6">
       <button
        onClick={() => {
         this.setState({ hasError: false, error: null })
         window.location.reload()
        }}
        className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-[8px] hover:shadow-md transition-all"
        aria-label="Ladda om sidan"
       >
        🔄 Ladda om sidan
       </button>
       <button
        onClick={() => {
         const errorMessage = this.state.error?.message || 'Okänt fel'
         const errorStack = this.state.error?.stack || ''
         const feedbackUrl = `/feedback?type=bug&subject=${encodeURIComponent(`Kritisk bugg: ${errorMessage.substring(0, 50)}`)}&message=${encodeURIComponent(
          `Kritisk bugg upptäckt!\n\n` +
          `Felmeddelande: ${errorMessage}\n\n` +
          `Sida: ${window.location.href}\n` +
          `Tidpunkt: ${new Date().toISOString()}\n\n` +
          `Stack trace:\n${errorStack.substring(0, 500)}`
         )}`
         window.location.href = feedbackUrl
        }}
        className="flex-1 bg-red-500 text-white font-bold py-2 px-6 rounded-[8px] hover:bg-red-600 hover:shadow-md transition-all"
        aria-label="Rapportera bugg"
       >
        🐛 Rapportera bugg
       </button>
      </div>
     </div>
    </div>
   )
  }

  return this.props.children
 }
}

