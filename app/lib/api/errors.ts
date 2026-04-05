import { apiError } from './response'

export function handleRouteError(error: unknown) {
  if (error instanceof Error) {
    const status = 'status' in error && typeof (error as Record<string, unknown>).status === 'number'
      ? (error as { status: number }).status
      : 500
    return apiError(error.message, status)
  }
  return apiError('An unexpected error occurred', 500)
}
