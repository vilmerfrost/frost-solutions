// app/lib/toast.ts
'use client'

import { toast as sonnerToast, ExternalToast } from 'sonner'

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, { description })
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, { description })
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, { description })
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, { description })
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
