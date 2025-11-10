// app/components/ui/error-message.tsx

/**
 * Error Message Component
 * Based on Claude implementation
 */

'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  helpLink?: string;
}

export function ErrorMessage({ title, message, onRetry, helpLink }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6"
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" aria-hidden="true" />
          </div>
        </div>
        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-300 mb-2">
              {title}
            </h3>
          )}
          <p className="text-red-800 dark:text-red-400 mb-4">{message}</p>
          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {onRetry && (
              <Button onClick={onRetry} variant="secondary" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Försök igen
              </Button>
            )}
            {helpLink && (
              <a
                href={helpLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-red-700 dark:text-red-400 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
              >
                Hjälp & support →
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

