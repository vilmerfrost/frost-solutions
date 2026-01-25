'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { XCircle, RefreshCw, ArrowLeft } from 'lucide-react';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Checkout Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Något gick fel
          </h2>
          
          <p className="text-gray-600 mb-6">
            Vi kunde inte ladda betalningssidan. Försök igen eller kontakta support om problemet kvarstår.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Försök igen
            </button>
            
            <Link
              href="/dashboard"
              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-4 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Tillbaka
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
