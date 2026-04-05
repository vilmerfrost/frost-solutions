import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function apiError(message: string, status = 500, details?: Record<string, unknown>) {
  return NextResponse.json(
    { success: false, error: message, ...(details && { details }) },
    { status }
  )
}

export function apiPaginated<T>(
  data: T[],
  meta: { page: number; limit: number; total: number }
) {
  return NextResponse.json({
    success: true,
    data,
    meta: {
      ...meta,
      totalPages: Math.ceil(meta.total / meta.limit),
      hasMore: meta.page * meta.limit < meta.total,
    },
  })
}
