// app/quotes/[id]/page.tsx
'use client'

import React, { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuote } from '@/hooks/useQuotes'
import { QuoteDetail } from '@/components/quotes/QuoteDetail'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/button'
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react'
import { useTenant } from '@/context/TenantContext'

export default function QuoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const quoteId = params.id as string

  const { tenantId, isLoading: tenantLoading } = useTenant()
  const { data: quote, isLoading, error, refetch, isError } = useQuote(quoteId)

  // Debug logging
  useEffect(() => {
    console.log('[QuoteDetailPage] Component state', {
      quoteId,
      tenantId,
      tenantLoading,
      isLoading,
      hasError: !!error,
      hasQuote: !!quote,
      errorMessage: error?.message,
    })
  }, [quoteId, tenantId, tenantLoading, isLoading, error, quote])

  // Loading state
  if (tenantLoading || isLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <p className="text-center text-gray-500 mt-4">
              {tenantLoading ? 'Verifierar behörighet...' : 'Laddar offert...'}
            </p>
          </div>
        </main>
      </div>
    )
  }

  // Error state with detailed information
  if (isError || error) {
    const errorMessage = error?.message || 'Ett okänt fel uppstod'
    const is401 = errorMessage.includes('401') || errorMessage.includes('inloggad')
    const is404 = errorMessage.includes('404') || errorMessage.includes('hittades inte')

    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
              {/* Error Card */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                    <AlertCircle size={32} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {is404 ? 'Offerten hittades inte' : is401 ? 'Åtkomst nekad' : 'Kunde inte ladda offert'}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      {is404 
                        ? 'Offerten existerar inte eller har raderats'
                        : is401 
                        ? 'Du har inte behörighet att visa denna offert'
                        : 'Ett tekniskt fel uppstod vid hämtning av offerten'
                      }
                    </p>
                  </div>
                </div>

                {/* Error details */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-red-800 dark:text-red-300 font-medium mb-2">
                    Felmeddelande:
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-400">
                    {errorMessage}
                  </p>
                </div>

                {/* Debug info (endast i development) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 mb-6">
                    <p className="text-xs font-mono text-gray-700 dark:text-gray-300">
                      <strong>Debug Info:</strong><br />
                      Quote ID: {quoteId}<br />
                      Tenant ID: {tenantId || 'null'}<br />
                      Error Type: {error?.constructor?.name || 'Unknown'}<br />
                      Status: {is404 ? '404' : is401 ? '401' : '500'}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="default"
                    onClick={() => router.push('/quotes')}
                    className="flex-1"
                  >
                    <ArrowLeft size={16} className="mr-2" />
                    Tillbaka till offerter
                  </Button>
                  
                  {!is401 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log('[QuoteDetailPage] Retrying fetch...')
                        refetch()
                      }}
                      className="flex-1"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Försök igen
                    </Button>
                  )}
                </div>

                {/* Help text */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {is401 && (
                      <>
                        <strong>Tips:</strong> Försök logga ut och in igen. Om problemet kvarstår, kontakta support.
                      </>
                    )}
                    {is404 && (
                      <>
                        <strong>Tips:</strong> Kontrollera att offerten inte har raderats. Du kan hitta den i offertlistan om den fortfarande finns.
                      </>
                    )}
                    {!is401 && !is404 && (
                      <>
                        <strong>Tips:</strong> Försök igen om en stund. Om problemet kvarstår, kontakta support.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // No data state (shouldn't happen if query is configured correctly)
  if (!quote) {
    console.warn('[QuoteDetailPage] No error but no quote data either')
    return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 lg:ml-0">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">Offerten kunde inte laddas</p>
              <Button onClick={() => router.push('/quotes')}>
                <ArrowLeft size={16} className="mr-2" />
                Tillbaka till offerter
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Success state
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 lg:ml-0">
        <div className="container mx-auto px-4 py-8">
          <QuoteDetail quote={quote} />
        </div>
      </main>
    </div>
  )
}
