// app/lib/toast.ts
'use client'

import { toast as sonnerToast, ExternalToast } from 'sonner'

type ToastOptions = string | ExternalToast

function normalizeOptions(options?: ToastOptions): ExternalToast | undefined {
  if (!options) return undefined
  if (typeof options === 'string') return { description: options }
  return options
}

export const toast = {
  success: (message: string, options?: ToastOptions) => {
    sonnerToast.success(message, normalizeOptions(options))
  },
  error: (message: string, options?: ToastOptions) => {
    sonnerToast.error(message, normalizeOptions(options))
  },
  info: (message: string, options?: ToastOptions) => {
    sonnerToast.info(message, normalizeOptions(options))
  },
  warning: (message: string, options?: ToastOptions) => {
    sonnerToast.warning(message, normalizeOptions(options))
  },
  promise: <T,>(
    promise: Promise<T>,
    { loading, success, error }: { loading: string; success: string; error: string }
  ) => {
    return sonnerToast.promise(promise, { loading, success, error })
  },
  custom: (message: string, data?: ExternalToast) => {
    sonnerToast(message, data)
  }
}
