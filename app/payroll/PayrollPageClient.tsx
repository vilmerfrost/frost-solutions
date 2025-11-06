'use client'

import { ReactNode } from 'react'

interface PayrollPageClientProps {
  month: string
  children: ReactNode
}

/**
 * Client component wrapper för att rendera client components i server component
 */
export default function PayrollPageClient({ children }: PayrollPageClientProps) {
  return <>{children}</>
}

